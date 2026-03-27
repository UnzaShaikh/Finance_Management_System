const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const authMiddleware = require("../middlewares/authMiddleware");

const {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  uploadTransactions,
  bulkCreateTransactions,
  splitTransaction
} = require("../controllers/transactionController");

// Protected routes (all transactions require auth)
router.use(authMiddleware);

router.post("/bulk", bulkCreateTransactions);
router.post("/upload", upload.single("file"), uploadTransactions);
router.post("/:id/split", splitTransaction);
router.post("/", createTransaction);
router.get("/", getTransactions);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

module.exports = router;
