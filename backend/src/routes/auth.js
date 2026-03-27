const express = require("express");
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, uploadAvatar } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post("/register", register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", login);

// @route   GET api/auth/me
// @desc    Get user profile data
// @access  Private
router.get("/me", authMiddleware, getMe);

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", authMiddleware, updateProfile);

// @route   PUT api/auth/password
// @desc    Change user password
// @access  Private
router.put("/password", authMiddleware, changePassword);
router.post("/upload-avatar", authMiddleware, upload.single('avatar'), uploadAvatar);

module.exports = router;
