const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const Video = require('../models/Video');
const auth = require('../middleware/auth');

// All playlist routes require authentication
router.use(auth);

// Get all playlists for logged in user with video stats
router.get('/', async (req, res) => {
  try {
    const playlists = await Playlist.find({ userId: req.user._id }).sort({ updatedAt: -1 });

    // Aggregate video metrics for each playlist
    const playlistIds = playlists.map(p => p._id);
    const videoStats = await Video.aggregate([
      { $match: { playlistId: { $in: playlistIds } } },
      {
        $group: {
          _id: '$playlistId',
          totalVideos: { $sum: 1 },
          doneVideos: {
            $sum: { $cond: [{ $eq: ['$revisionStatus', 'done'] }, 1, 0] }
          },
          needReviseVideos: {
            $sum: { $cond: [{ $eq: ['$revisionStatus', 'need_revise'] }, 1, 0] }
          },
          slightRevisionVideos: {
            $sum: { $cond: [{ $eq: ['$revisionStatus', 'slight_revision'] }, 1, 0] }
          }
        }
      }
    ]);

    const statsMap = {};
    videoStats.forEach(stat => {
      statsMap[stat._id.toString()] = stat;
    });

    const enrichedPlaylists = playlists.map(p => {
      const stat = statsMap[p._id.toString()] || {
        totalVideos: 0,
        doneVideos: 0,
        needReviseVideos: 0,
        slightRevisionVideos: 0
      };
      return {
        ...p.toObject(),
        totalVideos: stat.totalVideos,
        doneVideos: stat.doneVideos,
        needReviseVideos: stat.needReviseVideos,
        slightRevisionVideos: stat.slightRevisionVideos,
        progressPercentage: stat.totalVideos > 0 
          ? Math.round((stat.doneVideos / stat.totalVideos) * 100) 
          : 0
      };
    });

    return res.json(enrichedPlaylists);
  } catch (error) {
    console.error('Fetch playlists error:', error);
    return res.status(500).json({ message: 'Failed to fetch playlists.' });
  }
});

// Create new playlist
router.post('/', async (req, res) => {
  try {
    const { title, description, category, color } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Playlist title is required.' });
    }

    const playlist = new Playlist({
      userId: req.user._id,
      title: title.trim(),
      description: (description || '').trim(),
      category: (category || 'General').trim(),
      color: color || '#6366f1'
    });

    await playlist.save();
    return res.status(201).json(playlist);
  } catch (error) {
    console.error('Create playlist error:', error);
    return res.status(500).json({ message: 'Failed to create playlist.' });
  }
});

// Get playlist by ID with videos
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.user._id });
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found.' });
    }

    const videos = await Video.find({ playlistId: playlist._id, userId: req.user._id })
      .sort({ order: 1, createdAt: 1 });

    return res.json({
      playlist,
      videos
    });
  } catch (error) {
    console.error('Get playlist error:', error);
    return res.status(500).json({ message: 'Failed to retrieve playlist.' });
  }
});

// Update playlist
router.put('/:id', async (req, res) => {
  try {
    const { title, description, category, color } = req.body;
    const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.user._id });
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found.' });
    }

    if (title && title.trim()) playlist.title = title.trim();
    if (description !== undefined) playlist.description = description.trim();
    if (category) playlist.category = category.trim();
    if (color) playlist.color = color;
    playlist.updatedAt = Date.now();

    await playlist.save();
    return res.json(playlist);
  } catch (error) {
    console.error('Update playlist error:', error);
    return res.status(500).json({ message: 'Failed to update playlist.' });
  }
});

// Delete playlist
router.delete('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.user._id });
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found.' });
    }

    // Delete associated videos
    await Video.deleteMany({ playlistId: playlist._id });
    await Playlist.deleteOne({ _id: playlist._id });

    return res.json({ message: 'Playlist and its videos deleted successfully.' });
  } catch (error) {
    console.error('Delete playlist error:', error);
    return res.status(500).json({ message: 'Failed to delete playlist.' });
  }
});

module.exports = router;
