class AppError extends Error {
  constructor(message, statusCode, errorType, data = {}) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.errorType = errorType;
    this.data = data;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
