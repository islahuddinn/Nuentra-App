const express = require("express");
const userController = require("../Controllers/userController");
const authController = require("../Controllers/authController");
const eventController = require("../Controllers/eventController");
const router = express.Router();

router.post(
  "/create",
  // authController.protect,
  //   authController.restrictTo("admin"),
  // eventController.setCreator,
  eventController.postEvent
);

router.get("/", eventController.getallEvent);
router
  .route("/:id")
  .get(eventController.getOneEvent)
  .patch(
    // authController.protect,
    // authController.restrictTo("admin"),
    eventController.updateEvent
  )
  .delete(
    // authController.protect,
    // authController.restrictTo("admin"),
    eventController.deleteEvent
  );

module.exports = router;
