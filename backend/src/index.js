const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
// Ensure the uploads directory exists - handling Vercel's read-only filesystem
const isVercel = process.env.VERCEL === '1';
const uploadsPath = isVercel 
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '../uploads');

try {
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
} catch (error) {
  console.warn("Could not create uploads directory, likely on a read-only filesystem:", error.message);
}

app.use('/uploads', express.static(uploadsPath));

// Import Routes
const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const budgetRoutes = require("./routes/budgets");
const insightRoutes = require("./routes/insights");
const categoryRoutes = require("./routes/categories");

// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/insights", insightRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/uploads", require("./routes/uploadRoutes"));

// Base route for health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "Server is running!" });
});

// Start Server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

module.exports = app;
