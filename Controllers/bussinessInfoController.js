const catchAsync = require("../Utils/catchAsync");
const User = require("../Models/userModel");
const BusinessInfo = require("../Models/businessModel");
const Factory = require("./handleFactory");
const slugify = require("slugify");

//////=====User BusinessInfo APIs=========/////
exports.createBusinessInfo = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const businessInfo = req.body;

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

    // Create an object to store the BusinessInfo as key-value pairs
    const businessInfoObject = {};

    // Loop through the BusinessInfo object and store them in the BusinessInfo object
    for (const [key, value] of Object.entries(businessInfo)) {
      businessInfoObject[key] = value;
    }

    // Create a new interest object
    const newBusinessInfo = new BusinessInfo({
      userId: userId,
      businessInfo: businessInfoObject,
    });

    // Save the interest object
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
exports.deleteInterest = catchAsync(async (req, res, next) => {
  // Extract the interest ID from request parameters
  const { interestId } = req.params;
  console.log(interestId);
  // Find and delete the interest document by ID
  const deletedInterest = await Interest.findByIdAndDelete(interestId);

  if (!deletedInterest) {
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
    data: deletedInterest,
  });
});

exports.createInterest = Factory.creatOne(Interest);
exports.getAllInterest = Factory.getAll(Interest);
exports.getOneInterest = Factory.getOne(Interest);
exports.updateInterest = Factory.updateOne(Interest);
// exports.deleteInterest = Factory.deleteOne(Interest);
