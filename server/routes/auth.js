const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        bio: newUser.bio,
        avatar: newUser.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    user.isOnline = true;
    user.lastSeen = Date.now();
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE PROFILE
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { fullName, username, bio } = req.body;

    // Check if username is taken by someone else
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    res.json({
      user: {
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
