const mongoose = require("mongoose");

const termsandconditionSchema = mongoose.Schema(
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

// termsandconditionSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: "creator",
//     select: "name image",
//   });
//   next();
// });

const TermsandCondition = mongoose.model(
  "TermsandCondition",
  termsandconditionSchema
);

module.exports = TermsandCondition;
