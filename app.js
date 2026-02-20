require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Direct import - no middleware file needed
const connectDB = require('./connections/DB');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');
const cookieParser = require('cookie-parser');
// Import routes
// const productRoutes = require('./v1/routes/products');
const gSheetData = require("./v1/routes/gsheetRoutes")
const adminRoutes = require('./v1/routes/adminCrud');
const app = express();
const port = process.env.PORT || 3000; 

// Connect to database
// connectDB();

// Middleware stack
app.use(logger);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: "*" || process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Security middleware
app.use(require('helmet')());

// Routes
app.use('/v1/api', gSheetData);
// app.use('/v1/api/admin', adminRoutes);

// 404 handler (before global error handler)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Global error handler (must be last)
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
});

// Graceful shutdown
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
