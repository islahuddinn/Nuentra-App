const catchAsync = require("../Utils/catchAsync");
const User = require("../Models/userModel");
const BusinessInfo = require("../Models/businessModel");
const Factory = require("./handleFactory");

//////=====User BusinessInfo APIs=========/////

exports.createBusinessInfo = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const questionnaireAnswers = req.body.answers;

  try {
    // Find the user by userId
    const user = await User.findById(userId);

    // If user not found, return an error
    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "User not found",
      });
    }

    // Create a new BusinessInfo object with the user's ID and the questionnaire answers
    const newBusinessInfo = new BusinessInfo({
      userId: userId,
      businessInformation: questionnaireAnswers,
    });

    // Save the BusinessInfo object
    const savedBusinessInfo = await newBusinessInfo.save();

    // Return success response
    res.status(201).json({
      success: true,
      status: 201,
      message: "BusinessInfo created successfully",
      data: savedBusinessInfo,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Internal server error",
    });
  }
});

//// in case we need to delte user BusinessInfo
exports.deleteBusinessInfo = catchAsync(async (req, res, next) => {
  // Extract the interest ID from request parameters
  const { businessInfoId } = req.params;
  console.log(businessInfoId);
  // Find and delete the interest document by ID
  const deletedBusinessInfo = await BusinessInfo.findByIdAndDelete(
    businessInfoId
  );

  if (!deletedBusinessInfo) {
    // If no interest found with the provided ID, send a 404 error
    return res.status(404).json({
      success: false,
      message: "Interest not found",
    });
  }

  // Send a success response
  res.status(200).json({
    success: true,
    message: "Interest deleted successfully",
    data: deletedBusinessInfo,
  });
});

exports.getAllBusinessInfo = Factory.getAll(BusinessInfo);
exports.getOneBusinessInfo = Factory.getOne(BusinessInfo);
exports.updateBusinessInfo = Factory.updateOne(BusinessInfo);
// exports.deleteInterest = Factory.deleteOne(Interest);
