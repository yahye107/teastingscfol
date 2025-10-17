const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth-routes");
const classRoutes = require("./routes/class-routes");
const connectToDB = require("./database/db");

const app = express();

// 1. Connect to DB
connectToDB();

// 2. Set up CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// 3. Helmet security headers (CSP disabled globally for APIs)
app.use(
  helmet({
    contentSecurityPolicy: false, // disable CSP globally for APIs
  })
);

// 4. Cache headers
app.use((req, res, next) => {
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  } else if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  } else {
    res.setHeader("Cache-Control", "no-cache");
  }
  next();
});

// 5. Parse JSON, URL-encoded data, and cookies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 6. Routes
app.use("/api/auth", authRoutes);
app.use("/api/class", classRoutes);

// 7. Test & health check endpoints
app.get("/api", (req, res) =>
  res.status(200).json({ message: "hello express" })
);
app.get("/health", (req, res) =>
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() })
);

// 8. Serve frontend (React build)
const frontendPath = path.join(__dirname, "frontend", "dist");
app.use(express.static(frontendPath));

// 9. Catch-all frontend route (exclude /api)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// 10. Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
