try {
  const app = require("../backend/src/index");
  
  // Vercel handles the request, but we provide a catch-all for unexpected errors
  module.exports = (req, res) => {
    try {
      return app(req, res);
    } catch (err) {
      console.error("FUNCTION_RUNTIME_ERROR:", err);
      res.status(500).json({
        message: "Internal Server Error during execution",
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  };
} catch (err) {
  console.error("FUNCTION_INITIALIZATION_ERROR:", err);
  
  // If the require fails, we export a function that returns the error
  module.exports = (req, res) => {
    res.status(500).json({
      message: "Initialization Failed. Check Vercel logs.",
      error: err.message,
      stack: err.stack
    });
  };
}
