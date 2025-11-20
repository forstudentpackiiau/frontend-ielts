require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");

// Initialize database first
require("./database/init");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const testRoutes = require("./routes/tests");
const submissionRoutes = require("./routes/submissions");

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet()); // Adds security headers

// CORS with performance optimizations
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    maxAge: 86400, // Cache preflight requests for 24 hours
  })
);

// Compression middleware - reduces response size by ~70%
// Use higher compression for text-based responses
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      // Compress all text-based responses
      return compression.filter(req, res);
    },
    level: 9, // Maximum compression (0-9, 9 is best compression but slower)
    threshold: 1024, // Only compress if response is > 1KB
  })
);

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: "Too many login attempts, please try again later.",
});

app.use("/api/", limiter);
app.use("/api/auth/login", authLimiter);

// Body parser with size limits to prevent large payload attacks
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Enable ETag for efficient caching
app.set("etag", "strong");

// API response caching headers
app.use("/api", (req, res, next) => {
  // Cache GET requests for a short time
  if (req.method === "GET") {
    // Cache test database for 5 minutes (it rarely changes)
    if (req.path.includes("/tests")) {
      res.set("Cache-Control", "public, max-age=300, must-revalidate");
    } else {
      // Other API responses cache for 30 seconds
      res.set("Cache-Control", "public, max-age=30, must-revalidate");
    }
  } else {
    // Don't cache POST/PUT/DELETE
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  }
  next();
});

// Cache control for static assets (if serving any)
app.use((req, res, next) => {
  if (
    req.method === "GET" &&
    req.url.match(/\.(css|js|jpg|jpeg|png|gif|svg|woff|woff2|ttf|eot)$/)
  ) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
  next();
});

// Request logging in development
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/submissions", submissionRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
