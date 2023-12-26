const mongoose = require("mongoose");

const refreshRecordSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    device: String,
    status: {
      type: String,
      enum: ["refresh", "end"],
      default: "refresh",
    },
  },
  { timestamps: true }
);

const RefreshRecord = mongoose.model("RefreshRecord", refreshRecordSchema);
module.exports = RefreshRecord;
