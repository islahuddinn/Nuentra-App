const AppError = require("../Utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, "invalid-input");
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.message.match(/(["'])(\\?.)*?\1/);
  const duplicateValue = value ? value[0] : "unknown";
  const message = `Duplicate field value: ${duplicateValue}. Please use another value`;
  return new AppError(message, 400, "duplicate-field");
};

const handleValidationErrorDB = (err) => {
  if (err.errors) {
    const errors = Object.values(err.errors).map((error) => error.message);
    const message = `Invalid input data. ${errors.join(", ")}`;
    return new AppError(message, 400, "invalid-input-data");
  } else {
    return new AppError("Invalid input data", 400, "invalid-input");
  }
};

const handleJWTError = () =>
  new AppError("Invalid token. Please login again", 401, "invalid-token");

const handleTokenExpiredError = () =>
  new AppError("Expired token. Please login again", 401, "token-expired");

const sendErrorResponse = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.statusCode,
    message: err.message,
    errorType: err.errorType,
    data: err.data || {},
  });
};

module.exports = (err, req, res, next) => {
  console.error("Incoming Error:", err);

  if (process.env.NODE_ENV !== "test") {
    console.error(err);
  }

  if (process.env.NODE_ENV === "production") {
  }

  switch (err.name) {
    case "CastError":
      err = handleCastErrorDB(err);
      break;
    case 11000:
    case 11001:
    case "MongooseError":
      err = handleDuplicateFieldsDB(err);
      break;
    case "ValidationError":
    case "EPROTOCOL":
      err = handleValidationErrorDB(err);
      break;
    case "JsonWebTokenError":
      err = handleJWTError();
      break;
    case "TokenExpiredError":
      err = handleTokenExpiredError();
      break;
    default:
      return sendErrorResponse(err, res);
  }

  sendErrorResponse(err, res);
};
