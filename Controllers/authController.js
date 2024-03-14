const { promisify } = require("util");
const { randomUUID: uuid } = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../Models/userModel");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const { loginChecks } = require("../Utils/login-checks");
const jwt = require("jsonwebtoken");
const Email = require("../Utils/mailSend");
// const { findOneAndUpdate, findOne, startSession } = require("../models/");
const RefreshToken = require("../Models/refreshTokenModel");
const generateOtp = require("../Utils/otpGenerator");
// const cron = require("node-cron");
const RefreshRecord = require("../Models/refreshRecordModel");
const DeviceSession = require("../Models/sessionModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const signToken = (id, noExpiry) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    JSON.parse(
      JSON.stringify({
        expiresIn: noExpiry ? undefined : process.env.JWT_EXPIRES_IN,
      })
    )
  );
};
// ======== function to creat and send token===========

const creatSendToken = async (
  user,
  statusCode,
  message,
  res,
  device,
  noExpiry = false
) => {
  const token = signToken(user._id, noExpiry);

  const logedIn = await RefreshToken.findOne({
    deviceToken: device.deviceToken,
    user: user._id,
  });
  if (logedIn) {
    await RefreshToken.findByIdAndDelete(logedIn._id);
  }

  const sessions = await DeviceSession.find({ user: user._id });
  const refreshToken = uuid();
  await RefreshRecord.create({
    user: user._id,
    device: device.id,
    // createdAt: device.currentTime,
  });
  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    device: device.id,
    deviceToken: device.deviceToken,
  });
  const newUser = await User.findOne({ _id: user._id });
  return res.status(statusCode).json({
    success: true,
    status: statusCode,
    act: res.act,
    message,
    data: {
      token,
      user: newUser,
      refreshToken,
      sessions,
    },
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  const token = req.headers.authorization;

  // console.log(token);

  if (!token) {
    return next(
      new AppError(
        "You are not logged in please log in to get access.",
        401,
        "authentication-error"
      )
    );
  }

  // 2) verification token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // console.log(decoded);

  // 3) check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The User belongging to this token does no longer exist.",
        401,
        "Token-expired"
      )
    );
  }
  // 4) check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "User recently changed the password! please logion again",
        401,
        "authentication-error"
      )
    );
  }

  // Grant access to the protected route
  req.user = currentUser;
  next();
});

exports.socialLogin = catchAsync(async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (!user) {
    console.log("C_id", id);
    user = await User.create({
      ...JSON.parse(JSON.stringify(req.body)),
      email: req.body.email,
      customerId: id,
      verified: true,
      password: "default123",
    });
  }

  const logedIn = await RefreshToken.findOne({
    device: req.body.device.id,
    user: user._id,
  });
  if (logedIn) {
    await RefreshToken.findByIdAndRemove(logedIn._id);
  }

  res.act = loginChecks(user);
  return creatSendToken(
    user,
    200,
    "Logged in Successfully",
    res,
    req.body.device
  );
});
// =========SIGNUP USER=====================

exports.signup = catchAsync(async (req, res, next) => {
  // Check if password and confirm password match
  if (req.body.password !== req.body.confirmPassword) {
    return res.status(400).json({
      success: "fail",
      status: 400,
      message: "Password and confirm password do not match",
    });
  }

  let id;
  try {
    let obj = await stripe.customers.create({
      name: req.body.name,
      email: req.body.email,
    });
    id = obj.id;
  } catch (error) {
    console.log(error);
  }
  console.log("C_id", id);
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: "User with given email already exist",
      errorType: "email-already-exist",
      data: {},
    });
  }

  // If password and confirm password match, create new user
  const newUser = await User.create({
    fullName: req.body.fullName,
    email: req.body.email,
    image: req.body.image,
    userType: req.body.userType,
    locationUpdatedAt: Date.now(),
    // customerId: id,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    otp: null,
    passwordChangedAt: Date.now(),
  });

  const otpLength = 4;
  const otp = generateOtp(otpLength);
  console.log("Generated OTP:", otp);
  ////// Sending Email..
  try {
    await new Email(newUser, otp).sendWelcome(otp);
  } catch (error) {
    console.log(error);
  }
  ////// Expires Time
  // const otpExpires = Date.now() + 1 * 60 * 1000 + 10 * 1000;
  /////////////////

  console.log(req.body);
  const userotp = await User.findOne({ email: newUser.email });
  if (!userotp) {
    return res.status(400).json({
      status: 400,
      success: false,
      errorType: "wrong-email",
      data: {},
    });
  }
  const newUserotp = await User.findOneAndUpdate(
    { email: userotp.email },
    { otp },
    { new: true, runValidators: false }
  );

  console.log(otp);

  res.status(201).json({
    status: 201,
    success: true,
    message: `OTP Sent to your email ${newUser.email}`,
    data: { user: newUser },
  });
});

// ========= Send  OTP  =====================

exports.sendOTP = catchAsync(async (req, res, next) => {
  const otpLength2 = 4;
  // const otp = generateOtp(otpLength2);
  const otp = generateOtp(otpLength2);
  // console.log(req.body);
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).json({
      status: 400,
      success: false,
      errorType: "wrong-email",
      data: {},
    });
  }
  user.passwordResetToken = otp;
  await user.save();

  const newUser = await User.findOneAndUpdate(
    { email: req.body.email },
    { otp },
    { new: true, runValidators: false }
  );
  console.log(otp);

  try {
    await new Email(newUser, otp).sendWelcome(otp);
  } catch (error) {
    console.log(error);
  }

  console.log("end");
  res.status(200).json({
    status: 200,
    success: true,
    message: `OTP Sent to your email ${user.email}`,
    data: {},
  });
});

exports.verifyOtp = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    email: req.body.email,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).send({
      message: "Token may expire",
      success: false,
      errorType: "otp-expired",
      status: 400,
      data: {},
    });
  }
  if (user.otp != req.body.otp) {
    return res.status(400).send({
      message: "Invalid Token",
      success: false,
      errorType: "wrong-otp",
      status: 400,
      data: {},
    });
  }

  res.status(200).json({
    status: 200,
    success: true,
  });
});

// ===================Refresh Password=================================
exports.refresh = catchAsync(async (req, res, next) => {
  const tokenHashed = req.params.token;
  // console.log("Hahahahahaha");
  const tokens = await RefreshToken.find({ device: req.body.device.id });

  let done = false;
  let cycle = 0;
  for (const token of tokens)
    bcrypt.compare(tokenHashed, token.token, async (err, result) => {
      if (done) return;
      console.log(err, result);
      if (!(result == false || err)) {
        const user = await User.findOne({ _id: token.user });
        const accessToken = signToken(user._id, false);
        done = true;
        return res.json({
          status: 200,
          success: true,
          message: "",
          data: { accessToken },
        });
      }
      cycle += 1;
    });
  if (cycle == tokens.length)
    return res.status(400).send({
      status: 400,
      success: false,
      message: `Invalid refresh token for device ${req.body.device.id}`,
      data: {},
    });
});
// ===================Verify EMAIL BY OTP===============================
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const euser = await User.findOne({ email: req.body.email });
  if (!euser) {
    return res.status(400).send({
      success: false,
      status: 400,
      message: "Invalid Email",
      errorType: "wrong-email",
      data: {},
    });
  }

  const user = await User.findOne({
    email: req.body.email,
  });
  // if the token has not expired and there is a user set the new password

  if (!user) {
    return res.status(400).send({
      message: "User not found",
      success: false,
      errorType: "user-not-found",
      status: 400,
      data: {},
    });
  }

  if (!req.body.otp) {
    return res.status(400).send({
      success: true,
      status: 400,
      message: "Please add otp",

      data: {},
    });
  }
  if (req.body.otp != user.otp) {
    return res.status(400).send({
      success: true,
      status: 400,
      message: "The given OTP is invalid",
      errorType: "wrong-otp",
      data: {},
    });
  }
  const newUser = await User.findOneAndUpdate(
    { email: req.body.email },
    { verified: true, otp: null },
    { new: true }
  );
  // res.status(200).send({
  //   success: true,
  //   status: 200,

  //   data: {},
  // });

  res.act = loginChecks(newUser);
  creatSendToken(
    newUser,
    200,
    "The email has been verified",
    res,
    req.body.device
  );
});
//     ====================LOGIN User=========================================
exports.login = catchAsync(async (req, res, next) => {
  console.log("route hit for login");
  const { email, password, location } = req.body; // Extracting location from request body
  const defaultLocation = { type: "Point", coordinates: [0, 0] }; // Default location

  // check if email and password exist
  if (!email || !password) {
    return res.status(400).json({
      message: "Please provide email and password",
      status: 400,
      success: false,
      data: {},
    });
  }

  // check if user exists and password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return res.status(400).json({
      message: "Incorrect email or password",
      errorType: "wrong-password",
      status: 400,
      success: false,
      data: {},
    });
  }

  // Check if user is verified
  if (!user.verified) {
    const otpLength = 4;
    const otp = generateOtp(otpLength);

    ////// Sending Email..
    try {
      await new Email(user, otp).sendWelcome(otp);
    } catch (error) {
      console.log(error);
    }

    // Update user with OTP
    await User.findOneAndUpdate(
      { email: user.email },
      { otp },
      { new: true, runValidators: false }
    );

    return res.status(400).json({
      message: "Verification is pending. OTP sent to your email",
      errorType: "email-not-verified",
      status: 400,
      success: false,
      data: {},
    });
  }

  // Update device token and location
  await User.updateOne(
    { _id: user._id },
    {
      deviceToken: req.body.device && req.body.device.id,
      location: location || defaultLocation, // If location is not provided, set default location
    }
  );

  // Update user object with location
  user.location = location || defaultLocation;

  // Create and send token for user authentication
  creatSendToken(user, 200, "Logged In Successfully", res, req.body.device);
});

// ===========================VERIFY TOKEN BEFORE GETTING DATA=====================
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if its there
  let token;
  console.log("verifying token....");
  // console.log(req.headers.authorization);
  token = req.headers.authorization;
  // console.log("token is:", token);
  if (!token) {
    return res.status(400).send({
      message: "You are not logged in, please login to get access",
      status: 400,
      success: true,
      data: {},
    });
  }

  // Verification of  token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log("decoded", decoded);
  // console.log("token verified step 2.");
  //3) check if the user still exist
  // console.log(decoded);
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return res.status(400).send({
      message: "User not exist now",
      status: 400,
      success: false,
      data: {},
    });
  }
  // console.log("User exist step 3.");

  //check if the user changed the password after the token is issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return res.status(400).send({
      message: "User recently changed password please login again!",
      status: 400,
      success: false,
      data: {},
    });
  }
  console.log("Requested Users id>>>", currentUser._id);
  //grant access to the protected rout
  req.user = currentUser;
  // console.log(currentUser);
  console.log("verification completed");
  next();
});

// //================= Authorization=============
// //Restrict who can delete tour

// exports.restrictTo = (...roles) => {
//   return (req, res, next) => {
//     console.log(req.user.name, roles);
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).send({
//         status: 403,
//         success: false,
//         message: "You do not have permission to perform this action",
//         data: {},
//       });
//     }
//     next();
//   };
// };

// // =================================================================================

// // ======== FORGOT PASSWORD AND PASSWORD RESET ================

exports.forgotPassword = catchAsync(async (req, res, next) => {
  console.log("in forgotPassword");
  // 1) get user on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).send({
      message: "There is no user with given email address",
      errorType: "wrong-email",
      status: 400,
      success: false,
      data: {},
    });
  }

  // 2) generate the random reset token
  const otpLength4 = 4;
  const passwordResetToken = generateOtp(otpLength4);
  user.passwordResetToken = passwordResetToken;

  user.passwordResetExpires = Date.now() + 1 * 60 * 1000 + 10 * 1000;

  await user.save({ validateBeforeSave: false });

  try {
    await new Email(user, passwordResetToken).sendPasswordReset(
      passwordResetToken
    );
    res.status(200).json({
      status: 200,
      success: true,
      message: "OTP sent to email",
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(400).send({
      success: false,
      status: 400,
      errorType: "wrong-email",
      message: "There was an error while sending email. please try again later",
      data: {},
    });
  }
});

// ===================RESET PASSWORD===============================
exports.resetPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    email: req.body.email,
    // passwordResetExpires: { gt: Date.now() },
  });
  console.log(user);
  // if the token has not expired and there is a user set the new password

  if (!user) {
    return res.status(400).send({
      message: "User not found pleasse login again",
      success: false,
      errorType: "User not found",
      status: 400,
      data: {},
    });
  }
  if (user.passwordResetToken != req.body.otp) {
    return res.status(400).send({
      message: "Invalid Token",
      success: false,
      errorType: "wrong-otp",
      status: 400,
      data: {},
    });
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  if (req.body.password !== req.body.confirmPassword) {
    return res.status(400).json({
      success: "fail",
      status: 400,
      message: "Password and confirm password do not match",
    });
  }
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // if (user.role === "guardian" && !user.isGuardianActive) {
  //   user.isGuardianActive = true;
  // }

  await user.save({ validateBeforeSave: false });

  // res.act = loginChecks(user);
  creatSendToken(
    user,
    200,
    "The password has been updated successfully",
    res,
    req.body.device
  );

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 200,
  //   success: true,
  //   act: loginChecks(user),
  //   token,
  // });
});
// ===================Verify OTP for RESET PASSWORD===============================
exports.verifyOtpForResetPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    email: req.body.email,
    // passwordResetExpires: { gt: Date.now() },
  });
  // if the token has not expired and there is a user set the new password
  console.log(user);
  // console.log(req.body.email);
  // console.log(Date.now());
  // console.log(await User.findOne({ email: req.body.email }));

  if (!user) {
    return res.status(400).send({
      message: "Token may expire",
      success: false,
      errorType: "otp-expired",
      status: 400,
      data: {},
    });
  }
  if (user.passwordResetToken != req.body.otp) {
    return res.status(400).send({
      message: "Invalid Token",
      success: false,
      errorType: "wrong-otp",
      status: 400,
      data: {},
    });
  }

  res.status(200).json({
    status: 200,
    success: true,
  });
});

// ===========UPDATE PASSWORD for already login user=================================
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1)get user from collection.
  const user = await User.findById(req.user.id).select("+password");

  // check if posted current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return res.status(400).send({
      message: "Your current password is wrong",
      success: false,
      errorType: "incorrect-old-password",
      status: 400,
      data: {},
    });
  }
  // if so update password
  user.password = req.body.password;
  // user.confirmPassword = req.body.confirmPassword;
  await user.save();
  // Log user in  , send jwt
  res.act = loginChecks(user);
  creatSendToken(
    user,
    200,
    "The password has been updated successfully",
    res,
    req.body.device
  );
});

exports.logout = catchAsync(async (req, res, next) => {
  const device = req.body.device;
  await RefreshToken.deleteOne({ device: device.id, user: req.user._id });
  return res.json({
    success: true,
    status: 200,
    message: "User logged out successfully",
    data: {},
  });
});
