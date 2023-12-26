const mongoose = require("mongoose");

const deviceSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    device: String,
    startTime: Date,
    endTime: Date,
    duration: Number,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

const DeviceSession = mongoose.model("DeviceSession", deviceSessionSchema);
module.exports = DeviceSession;
