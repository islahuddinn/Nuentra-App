const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deviceToken: String,
    token: String,
    device: String,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

refreshTokenSchema.pre("save", async function (next) {
  //only run this function if password id actually modified
  if (!this.isModified("token")) return next();
  // Hash the password with cost
  this.token = bcrypt.hash(this.token, 12);
  next();
});

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
module.exports = RefreshToken;
