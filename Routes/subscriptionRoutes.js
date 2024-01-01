const express = require("express");
const userController = require("../Controllers/userController");
const authController = require("../Controllers/authController");
const subscriptionController = require("../Controllers/subscriptionController");
const router = express.Router();

router.post(
  "/create-subscription/:id",
  subscriptionController.createSubscription
);

router.get("/types", subscriptionController.types);

router.post("/confirm/:id", subscriptionController.confirmSubscription);

router.patch("/cancel", authController.protect, subscriptionController.cancel);

router.get(
  "/status",
  authController.protect,
  subscriptionController.subscriptionStatus
);

router.post(
  "/subscription-webhook",
  subscriptionController.subscriptionWebHook
);

module.exports = router;
