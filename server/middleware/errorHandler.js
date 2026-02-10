// middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {

  console.error("🔥 ERROR:", err); // log full error

  let statusCode = err.statusCode || 500;
  let message = err.message || "Server Error";

  // =============================
  // MONGODB CAST ERROR
  // =============================
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Resource not found with id ${err.value}`;
  }

  // =============================
  // DUPLICATE KEY ERROR
  // =============================
  if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate field value entered";
  }

  // =============================
  // VALIDATION ERROR
  // =============================
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message)[0];
  }

  res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = errorHandler;
