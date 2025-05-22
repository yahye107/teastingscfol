const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const authRoutes = require("./routes/auth-routes");
const classRoutes = require("./routes/class-routes");
const app = express();
const connectToDB = require("./database/db");
// const qouteRoutes = require("./routes/qoute_routs");
// 1. Connect to DB first
connectToDB();

// 2. Set up CORS before routes
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    // allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// 3. Other middlewares
app.use(express.json());
app.use(cookieParser());

// 4. Routes
app.use("/api/auth", authRoutes);

app.use("/api/class", classRoutes);
// app.use("/api/quote", qouteRoutes);

// 5. Test endpoint (optional)
app.use("/api", (req, res) => {
  res.status(200).json({ message: "hello express" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
