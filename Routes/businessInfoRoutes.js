const express = require("express");
const userController = require("../Controllers/userController");
const authController = require("../Controllers/authController");
const businessInfoController = require("../Controllers/bussinessInfoController");
const router = express.Router();

router.use(authController.protect);
router.post("/create", businessInfoController.createBusinessInfo);

router.get("/", businessInfoController.getAllBusinessInfo);
router
  .route("/:id")
  .get(businessInfoController.getOneBusinessInfo)
  .patch(businessInfoController.updateBusinessInfo)
  .delete(businessInfoController.deleteBusinessInfo); // not functional

module.exports = router;
