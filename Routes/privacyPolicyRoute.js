const express = require("express");
const userController = require("../Controllers/userController");
const authController = require("../Controllers/authController");
const PrivacyController = require("../Controllers/privacy-policyController");
const router = express.Router();

router.post(
  "/create",
  authController.protect,
  //   authController.restrictTo("admin"),
  PrivacyController.setCreator,
  PrivacyController.createPrivacy
);

router.get("/", PrivacyController.getallPrivacy);
router
  .route("/:id")
  .get(PrivacyController.getOnePrivacy)
  .patch(
    authController.protect,
    // authController.restrictTo("admin"),
    PrivacyController.updatePrivacy
  )
  .delete(
    authController.protect,
    // authController.restrictTo("admin"),
    PrivacyController.deletePrivacy
  );

module.exports = router;
