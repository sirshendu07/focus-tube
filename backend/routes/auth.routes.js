const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Video = require('../models/Video');
const Playlist = require('../models/Playlist');
const auth = require('../middleware/auth');

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'focustube_fallback_secret_key';
  return jwt.sign({ id: userId }, secret, { expiresIn: '14d' });
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are all required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password
    });

    await user.save();

    // Create a starter playlist for convenience
    const starterPlaylist = new Playlist({
      userId: user._id,
      title: 'My First Focus Playlist',
      description: 'Add your study lectures, tutorials, or focus sessions here.',
      category: 'Learning',
      color: '#6366f1'
    });
    await starterPlaylist.save();

    const token = generateToken(user._id);

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: error.message || 'Server error during registration.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    return res.json({
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: error.message || 'Server error during login.' });
  }
});

// Get Current User Profile & Quick Stats
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalPlaylists, videoCounts] = await Promise.all([
      Playlist.countDocuments({ userId }),
      Video.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$revisionStatus',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const stats = {
      playlistsCount: totalPlaylists,
      totalVideos: 0,
      needRevise: 0,
      slightRevision: 0,
      done: 0,
      unwatched: 0
    };

    videoCounts.forEach((group) => {
      stats.totalVideos += group.count;
      if (group._id === 'need_revise') stats.needRevise = group.count;
      if (group._id === 'slight_revision') stats.slightRevision = group.count;
      if (group._id === 'done') stats.done = group.count;
      if (group._id === 'unwatched') stats.unwatched = group.count;
    });

    return res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt,
        stats
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ message: 'Error fetching profile statistics.' });
  }
});

module.exports = router;
