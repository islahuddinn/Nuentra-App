var mongoose = require("mongoose");
var Schema = mongoose.Schema;

const notificationSchema = new mongoose.Schema(
  {
    notifyType: String,
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    receiver: { type: Schema.Types.ObjectId, ref: "User" },
    multireceiver: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isSeen: [{ type: Schema.Types.ObjectId, ref: "User" }],
    title: String,
    text: String,
    data: Object,
    description: String,
    additionalData: Array,
    actionTaken: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
