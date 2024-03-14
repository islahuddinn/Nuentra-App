const catchAsync = require("../Utils/catchAsync");
const Event = require("../Models/eventModel");
const factory = require("./handleFactory");

exports.postEvent = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    location,
    image,
    eventInfo,
    age,
    date,
    duration,
  } = req.body;

  const newEvent = new Event({
    title,
    description,
    location,
    image,
    eventInfo,
    age,
    date,
    duration,
  });

  const createEvent = await newEvent.save();

  res.status(201).json({
    status: 201,
    success: true,
    event: createEvent,
  });
});
exports.updateEvent = factory.updateOne(Event);
exports.getallEvent = factory.getAll(Event);
exports.getOneEvent = factory.getOne(Event);
exports.deleteEvent = factory.deleteOne(Event);
