const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      default: "Point",
    },
    coordinates: { type: [Number], default: [0, 0] },
  },
  image: String,
  eventInfo: {
    type: String,
    required: true,
  },
  age: {
    type: String,
    // required: true,
  },
  date: {
    type: Date,
    // required: true,
  },
});

const Event = mongoose.model("Event", eventSchema);
module.exports = Event;
