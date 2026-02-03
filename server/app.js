require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Direct import - no middleware file needed
const connectDB = require('./connections/DB');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');
const cookieParser = require('cookie-parser');
// Import routes
const productRoutes = require('./v1/routes/products');
const adminRoutes = require('./v1/routes/adminCrud');
const app = express();
const PORT = process.env.PORT || 5000; 

// Connect to database
connectDB();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Middleware stack - FIXED CORS
app.use(logger);
app.use(cookieParser());
// app.use(cors({
//   origin: process.env.NODE_ENV === 'production' 
    // ? process.env.CLIENT_URL 
//     : 'http://localhost:5173',
//   credentials: true
// }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(require('helmet')());

// Health check
app.get('/v1/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/v1/api/products', productRoutes);
app.use('/v1/api/admin', adminRoutes);


// Global error handler (must be last)
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
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


// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');

// const connectDB = require('./connections/DB');

// // ✅ IMPORT ALL MIDDLEWARE FIRST
// const errorHandler = require('./middleware/errorHandler');
// const logger = require('./middleware/logger');
// const adminAuth = require('./middleware/adminAuth'); // Your new middleware

// const app = express();
// const PORT = process.env.PORT || 5000;

// connectDB();

// app.use(logger);
// app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
// app.use(helmet());
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

// // Routes FIRST (before error handlers)
// app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// // Admin routes
// app.use('/api/admin', require('./v1/routes/admin'));

// // 404 handler (before global error handler)
// app.use('*', (req, res) => {
//   res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
// });

// // GLOBAL ERROR HANDLER LAST (4 params identifies it as error handler)
// app.use(errorHandler); // ← This must be a FUNCTION

// const server = app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
