const TermsandCondition = require("../Models/termsAndConditionModel");
const AppError = require("../Utils/appError");
const catchAsync = require("../Utils/catchAsync");
const factory = require("./handleFactory");

exports.setCreator = catchAsync(async (req, res, next) => {
  req.body.creator = req.user.id;
  next();
});

exports.createTermsandCondition = catchAsync(async (req, res, next) => {
  const oldTermsandCondition = await TermsandCondition.find();

  if (oldTermsandCondition.length > 0) {
    return next(
      new AppError(
        "Terms and Condition Already Exists you cannot create 2 Terms and Condition.",
        400
      )
    );
  }

  const termsandcondition = await TermsandCondition.create(req.body);

  res.status(201).json({
    success: true,
    termsandcondition,
  });
});
exports.updateTermsandCondition = factory.updateOne(TermsandCondition);
exports.getallTermsandCondition = factory.getAll(TermsandCondition);
exports.getOneTermsandCondition = factory.getOne(TermsandCondition);
exports.deleteTermsandCondition = factory.deleteOne(TermsandCondition);
