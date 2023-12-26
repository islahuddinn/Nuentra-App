const Privacy = require("../Models/privacyPolicyModel");
const AppError = require("../Utils/appError");
const catchAsync = require("../Utils/catchAsync");
const factory = require("./handleFactory");

exports.setCreator = catchAsync(async (req, res, next) => {
  req.body.creator = req.user.id;
  next();
});

exports.createPrivacy = catchAsync(async (req, res, next) => {
  const oldPrivacy = await Privacy.find();

  if (oldPrivacy.length > 0) {
    return next(
      new AppError("Privacy Already Exists you cannot create 2 Privacy.", 400)
    );
  }

  const privacy = await Privacy.create(req.body);

  res.status(201).json({
    success: true,
    privacy,
  });
});
exports.updatePrivacy = factory.updateOne(Privacy);
exports.getallPrivacy = factory.getAll(Privacy);
exports.getOnePrivacy = factory.getOne(Privacy);
exports.deletePrivacy = factory.deleteOne(Privacy);
