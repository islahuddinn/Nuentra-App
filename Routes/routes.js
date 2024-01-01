const express = require("express");
const userRoutes = require("./userRoute");
const privacyRoutes = require("./privacyPolicyRoute");
const termsandconditionRoutes = require("./termsAndConditionRoute");
const subscriptionRoutes = require("./subscriptionRoutes");
// const timerRoutes = require("./timerRoutes");

const setupRoutesV1 = () => {
  const router = express.Router();
  router.use("/user", userRoutes);
  router.use("/privacy", privacyRoutes);
  router.use("/termsandcondition", termsandconditionRoutes);
  router.use("/subscription", subscriptionRoutes);

  // router.use("/timers", timerRoutes);

  return router;
};
module.exports = setupRoutesV1;
