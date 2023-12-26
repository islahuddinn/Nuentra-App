const express = require("express");
const userController = require("../Controllers/userController");
const authController = require("../Controllers/authController");
const TermsandConditionController = require("../Controllers/termsAndConditionController");
const router = express.Router();

router.post(
  "/create",
  authController.protect,
  //   authController.restrictTo("admin"),
  TermsandConditionController.setCreator,
  TermsandConditionController.createTermsandCondition
);

router.get("/", TermsandConditionController.getallTermsandCondition);
router
  .route("/:id")
  .get(TermsandConditionController.getOneTermsandCondition)
  .patch(
    authController.protect,
    // authController.restrictTo("admin"),
    TermsandConditionController.updateTermsandCondition
  )
  .delete(
    authController.protect,
    // authController.restrictTo("admin"),
    TermsandConditionController.deleteTermsandCondition
  );

module.exports = router;
