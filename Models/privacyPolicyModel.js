const mongoose = require("mongoose");

const privacySchema = mongoose.Schema(
  {
    data: String,
    creator: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// privacySchema.pre(/^find/, function (next) {
//   this.populate({
//     path: "creator",
//     select: "name image",
//   });
//   next();
// });

const Privacy = mongoose.model("Privacy", privacySchema);

module.exports = Privacy;
