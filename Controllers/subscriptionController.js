const User = require("../Models/userModel");
const AppError = require("../Utils/appError");
const catchAsync = require("../Utils/catchAsync");
const { loginChecks } = require("../Utils/login-checks");
const { creatSendToken } = require("./authController");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const allSubscriptionTypes = {
  yearly: {
    type: "Yearly Plan",
    price: 29,
    duration: "yearly",
  },
  //   halfYear: { type: "Plus Plan", price: 132, duration: "6month" },
  // monthly: {
  //   type: "Monthly Plan",
  //   price: 1.11,
  //   trialType: "day",
  //   trial: 3,
  //   duration: "monthly",
  // },
};

const ResponseObject = (status, success, message, data) => {
  return {
    status,
    success,
    message,
    data,
  };
};

exports.createSubscription = catchAsync(async (req, res, next) => {
  //   const customerId = req.cookies['customer'];
  //   const priceId = req.body.priceId;
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError("User not found", 404));
  // if (req.body.isTrial) {
  //   if (user.isTrialTaken) {
  //     return next(new AppError("You have already taken the trial", 400));
  //   }
  //   const user1 = await User.findByIdAndUpdate(
  //     user._id,
  //     {
  //       isTrial: true,
  //       isTrialTaken: true,
  //       subscriptionPlan: "trial",
  //       trialEndAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
  //     },
  //     { new: true, runValidators: false }
  //   );

  //   // return res.status(200).send({
  //   //   success: true,
  //   //   status: 200,
  //   //   message: "Successfully Activated Trial",
  //   //   act: "trial",
  //   //   data: { user1 },
  //   // });
  //   res.act = loginChecks(user1);

  //   return creatSendToken(
  //     user1,
  //     200,
  //     "Successfully Activated Trial",
  //     res,
  //     req.body.device
  //   );
  // }

  let { customerId, subscriptionId } = user;
  if (subscriptionId) {
    await stripe.subscriptions.del(subscriptionId);
    await User.findOneAndUpdate(
      { _id: user._id },
      { $set: { subscriptionId: null, subscriptionPlan: "free" } }
    );
  }
  if (!customerId) {
    let id;
    try {
      let obj = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });
      id = obj.id;
    } catch (error) {
      console.log(error);
    }
    console.log("C_id", id);

    await User.findByIdAndUpdate(user._id, {
      customerId: id,
    });

    customerId = id;
  }

  console.log("Customer is here ", customerId);

  let subscriptionType = null;
  subscriptionType =
    req.body.type === allSubscriptionTypes.yearly.type
      ? process.env.STRIPE_YEARLY
      : null;

  try {
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: "2022-08-01" }
    );

    // Create the subscription. Note we're expanding the Subscription's
    // latest invoice and that invoice's payment_intent
    // so we can pass it to the front end to confirm the payment
    let subscription;
    // if (req.body.isTrial) {
    //   subscription = await stripe.subscriptions.create({
    //     customer: customerId,
    //     items: [
    //       {
    //         price: `${subscriptionType}`,
    //       },
    //     ],
    //     payment_behavior: "default_incomplete",
    //     payment_settings: { save_default_payment_method: "on_subscription" },
    //     trial_period_days: 3, // Set the trial period to 3 days
    //     metadata: {
    //       userId: user._id,
    //     },
    //     expand: ["latest_invoice.payment_intent"],
    //   });
    //   console.log("Subscription", subscription);
    // } else {
    subscription = await stripe.subscriptions.create({
      customer: customerId,
      // metadata: {
      //   userId: user.id,
      // },
      items: [
        {
          price: `${subscriptionType}`,
        },
      ],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      metadata: {
        userId: user.id,
      },
      expand: ["latest_invoice.payment_intent"],
    });
    // }

    // if (req.body.isTrial) {
    //   res.status(201).json({
    //     status: 200,
    //     success: true,
    //     customerId,
    //     subscriptionId: subscription.id,
    //     ephemeralKey,
    //     publishableKey: process.env.STRIPE_PK_KEY,
    //     subscription,
    //   });
    // } else {
    res.status(201).json({
      status: 200,
      success: true,
      act: "subscription-pay-request",
      customerId,
      subscriptionId: subscription.id,
      paymentIntentId: subscription.latest_invoice.payment_intent.id,
      ephemeralKey,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      publishableKey:
        "pk_test_51LVrpTDvaubKxP1oDwMPA0AF1twyVDXvxvgMmcAlxhqtOS6uPSHrMl2kA47XkWZLEwJ6xY2DWvt7swpxWPavQC9F00aBWuFM26",
      subscription,
    });
    // }
  } catch (error) {
    return res.status(400).send({ error: { message: error.message } });
  }
});

exports.confirmSubscription = catchAsync(async (req, res) => {
  let user = await User.findById(req.params.id);
  const { subscriptionId, paymentIntentId, isTrial } = req.body;
  //   const paymentIntentId = "pi_3Nt7EbDvaubKxP1o1l2eEiWh";
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const subscriptionDetails = await stripe.subscriptions.retrieve(
    subscriptionId
  );

  console.log("Payment Intent", paymentIntent);
  console.log("Susbcription", subscriptionDetails);

  // if (isTrial) {
  //   const trialEndAt = Date.now() + 3 * 24 * 60 * 60 * 1000;

  //   user = await User.findByIdAndUpdate(
  //     user._id,
  //     {
  //       subscriptionId: subscriptionId,
  //       isTrial: true,
  //       isTrialTaken: true,
  //       trialEndAt: trialEndAt,
  //       subscriptionPlan:
  //         req.body.type === allSubscriptionTypes.monthly.type
  //           ? "monthly"
  //           : req.body.type === allSubscriptionTypes.yearly.type
  //           ? "yearly"
  //           : "free",
  //     },
  //     { new: true, runValidators: false }
  //   );
  //   res.act = loginChecks(user);
  //   creatSendToken(user, 200, "Successfully Subscribed", res, req.body.device);
  // } else {
  if (paymentIntent && paymentIntent.status === "succeeded") {
    user = await User.findByIdAndUpdate(
      user._id,
      {
        subscriptionId: subscriptionId,
        isTrial: false,
        isTrialTaken: true,
        subscriptionPlan:
          req.body.type === allSubscriptionTypes.yearly.type
            ? "yearly"
            : "free",
      },
      { new: true, runValidators: false }
    );
    res.act = loginChecks(user);
    creatSendToken(user, 200, "Successfully Subscribed", res, req.body.device);
  } else {
    res.status(200).send({
      success: false,
      status: 400,
      message: "Payment not succeeded",
      data: { user, paymentIntent, subscriptionDetails },
    });
  }
  // }
});

module.exports.types = async function (req, res, next) {
  try {
    return res.json({
      status: 200,
      success: true,
      message: "Current Subscription Types Retrieved Successfully",
      data: {
        // types: {
        free: Object.values(allSubscriptionTypes).filter(
          (x) => x.type == "Free Trial"
        ),
        premium: Object.values(allSubscriptionTypes).filter(
          (x) => x.type != "Free Trial"
        ),
        // }
      },
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "Server Error",
    });
  }
};

module.exports.cancel = async function (req, res, next) {
  try {
    const valid = { success: true };
    if (valid.success) {
      const user = await User.findOne({ _id: req.user._id });
      if (user.subscriptionId) {
        await stripe.subscriptions.del(user.subscriptionId);
      }
      await User.findOneAndUpdate(
        { _id: req.user._id },
        {
          $set: {
            subscriptionId: null,
            subscriptionPlan: "free",
          },
        }
      );
      const userRefetch = await User.findOne({ _id: user._id });
      return res.status(200).send(
        ResponseObject(200, true, "Subscription Cancelled Successfully", {
          user: userRefetch,
        })
      );
    } else {
      return res.status(200).send(valid);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(ResponseObject(500, false, "Server Error", {}));
  }
};

module.exports.subscriptionStatus = async function (req, res, next) {
  try {
    const userId = req.user._id;
    const user = await User.findOne({ _id: userId });
    return res.status(200).send(
      ResponseObject(200, true, "Status", {
        subscriptionStatus: user.subscriptionPlan,
      })
    );
  } catch (error) {
    console.log(error);
    return res.status(500).send(ResponseObject(500, false, "Server Error", {}));
  }
};

exports.subscriptionWebHook = catchAsync(async (request, response) => {
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  let user;
  // Handle the event
  switch (event.type) {
    case "customer.subscription.paused":
      const customerSubscriptionPaused = event.data.object;
      // Then define and call a function to handle the event customer.subscription.paused

      user = await User.findOne({
        _id: customerSubscriptionPaused.metadata.userId,
      });
      if (user.subscriptionId) {
        await stripe.subscriptions.del(user.subscriptionId);
      }

      await User.findByIdAndUpdate(user._id, {
        subscriptionId: null,
        subscriptionPlan: "free",
        isTrial: false,
        isTrialTaken: true,
      });
      break;
    // // ... handle invoice
    // case "invoice.payment_failed":
    //   const invoicePaymentFailed = event.data.object;
    //   user = await User.findOne({
    //     customerId: invoicePaymentFailed.customer,
    //   });
    //   if (user.subscriptionId) {
    //     await stripe.subscriptions.del(user.subscriptionId);
    //   }
    //   await User.findByIdAndUpdate(user._id, {
    //     subscriptionId: null,
    //     subscriptionPlan: "free",
    //     isTrial: false,
    //     isTrialTaken: true,
    //   });
    //   // Then define and call a function to handle the event invoice.payment_failed
    //   break;
    // case "invoice.payment_succeeded":
    //   const invoicePaymentSucceeded = event.data.object;
    //   user = await User.findOne({
    //     customerId: invoicePaymentSucceeded.customer,
    //   });
    //   await User.findByIdAndUpdate(user._id, {
    //     isTrial: false,
    //     isTrialTaken: true,
    //   });
    //   // Then define and call a function to handle the event invoice.payment_succeeded
    //   break;
    // // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});
