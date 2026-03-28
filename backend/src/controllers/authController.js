const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");

const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    // Create payload and return jwt
    const payload = { id: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email, defaultCurrency: user.defaultCurrency || 'PKR', avatarUrl: user.avatarUrl, bio: user.bio, phone: user.phone } 
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const payload = { id: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email, defaultCurrency: user.defaultCurrency || 'PKR', avatarUrl: user.avatarUrl, bio: user.bio, phone: user.phone } 
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, defaultCurrency: true, avatarUrl: true, bio: true, phone: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (error) {
    console.error("GetMe Error:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};

const updateProfile = async (req, res) => {
  const { name, email, defaultCurrency } = req.body;
  try {
    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ message: "Email is already taken" });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name || undefined,
        email: email || undefined,
        defaultCurrency: defaultCurrency || undefined,
        avatarUrl: req.body.avatarUrl || undefined,
        bio: req.body.bio !== undefined ? req.body.bio : undefined,
        phone: req.body.phone !== undefined ? req.body.phone : undefined,
      },
      select: { id: true, name: true, email: true, defaultCurrency: true, avatarUrl: true, bio: true, phone: true },
    });

    res.json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "Server error changing password" });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    // Construct public URL
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
    
    res.json({ 
      message: "Avatar uploaded successfully", 
      avatarUrl: fileUrl 
    });
  } catch (error) {
    console.error("Upload Avatar Error:", error);
    res.status(500).json({ message: "Server error uploading avatar" });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword, uploadAvatar };
