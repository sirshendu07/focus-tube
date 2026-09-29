const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const Playlist = require('../models/Playlist');
const auth = require('../middleware/auth');
const { extractYouTubeId, fetchYouTubeMetadata } = require('../utils/youtube');

// Public preview endpoint (no auth required so visitors can preview immediately)
router.get('/preview', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || !url.trim()) {
      return res.status(400).json({ message: 'URL query parameter is required.' });
    }

    const trimmedUrl = url.trim();
    const youtubeId = extractYouTubeId(trimmedUrl);
    if (!youtubeId) {
      if (trimmedUrl.includes('playlist?list=') || trimmedUrl.includes('/playlist')) {
        return res.status(400).json({ 
          message: 'This is a YouTube playlist link. Please open any video in the playlist and paste its URL to watch or add it.' 
        });
      }
      return res.status(400).json({ 
        message: 'Could not find a valid YouTube video in this link. Please check the URL and try again.' 
      });
    }

    const meta = await fetchYouTubeMetadata(youtubeId);
    return res.json({
      youtubeId,
      ...meta
    });
  } catch (error) {
    console.error('Video preview error:', error);
    return res.status(500).json({ message: 'Failed to fetch video preview.' });
  }
});

// All following video routes require authentication
router.use(auth);

// List videos with filters (e.g. by status, playlistId, search)
router.get('/', async (req, res) => {
  try {
    const { status, playlistId, search } = req.query;
    const filter = { userId: req.user._id };

    if (status && ['need_revise', 'slight_revision', 'done', 'unwatched'].includes(status)) {
      filter.revisionStatus = status;
    } else if (status === 'revision_queue') {
      // Need revise OR slight revision
      filter.revisionStatus = { $in: ['need_revise', 'slight_revision'] };
    }

    if (playlistId) {
      if (playlistId === 'unassigned') {
        filter.playlistId = null;
      } else {
        filter.playlistId = playlistId;
      }
    }

    if (search && search.trim()) {
      filter.title = { $regex: search.trim(), $options: 'i' };
    }

    const videos = await Video.find(filter)
      .populate('playlistId', 'title color category')
      .sort({ updatedAt: -1 });

    return res.json(videos);
  } catch (error) {
    console.error('List videos error:', error);
    return res.status(500).json({ message: 'Failed to fetch videos.' });
  }
});

// Add a new video to playlist or standalone
router.post('/', async (req, res) => {
  try {
    const { url, playlistId, title, customNotes, revisionStatus } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ message: 'YouTube URL or ID is required.' });
    }

    const youtubeId = extractYouTubeId(url);
    if (!youtubeId) {
      if (url.includes('playlist?list=') || url.includes('/playlist')) {
        return res.status(400).json({ 
          message: 'This is a YouTube playlist link. Please open any video in the playlist and paste its URL.' 
        });
      }
      return res.status(400).json({ message: 'Could not detect a valid YouTube Video ID from the link. Please check the URL.' });
    }

    // Check if user already added this video to the same playlist
    const existing = await Video.findOne({
      userId: req.user._id,
      youtubeId,
      playlistId: playlistId || null
    });
    if (existing) {
      return res.status(400).json({
        message: 'This video is already in this playlist.',
        existingVideo: existing
      });
    }

    // Fetch video metadata via oEmbed
    const meta = await fetchYouTubeMetadata(youtubeId);

    // Compute order in playlist
    let order = 0;
    if (playlistId) {
      const highestOrder = await Video.findOne({ userId: req.user._id, playlistId })
        .sort({ order: -1 })
        .select('order');
      if (highestOrder) {
        order = highestOrder.order + 1;
      }
    }

    const video = new Video({
      userId: req.user._id,
      playlistId: playlistId || null,
      youtubeId,
      youtubeUrl: url.startsWith('http') ? url : `https://www.youtube.com/watch?v=${youtubeId}`,
      title: (title && title.trim()) || meta.title,
      channelTitle: meta.channelTitle || '',
      thumbnailUrl: meta.thumbnailUrl,
      order,
      revisionStatus: revisionStatus || 'unwatched',
      notes: customNotes || '',
      timestamps: []
    });

    await video.save();

    // Populate playlist info before returning
    if (playlistId) {
      await video.populate('playlistId', 'title color category');
    }

    return res.status(201).json(video);
  } catch (error) {
    console.error('Add video error:', error);
    return res.status(500).json({ message: error.message || 'Failed to add video.' });
  }
});

// Get single video by ID
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('playlistId', 'title color category');

    if (!video) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    return res.json(video);
  } catch (error) {
    console.error('Get video error:', error);
    return res.status(500).json({ message: 'Failed to retrieve video.' });
  }
});

// Update revision status: 'need_revise' | 'slight_revision' | 'done' | 'unwatched'
router.patch('/:id/revision', async (req, res) => {
  try {
    const { revisionStatus } = req.body;
    if (!['need_revise', 'slight_revision', 'done', 'unwatched'].includes(revisionStatus)) {
      return res.status(400).json({ message: 'Invalid revision status.' });
    }

    const video = await Video.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { revisionStatus, updatedAt: Date.now() },
      { new: true }
    ).populate('playlistId', 'title color category');

    if (!video) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    return res.json(video);
  } catch (error) {
    console.error('Update revision status error:', error);
    return res.status(500).json({ message: 'Failed to update revision status.' });
  }
});

// Update notes & timestamps
router.patch('/:id/notes', async (req, res) => {
  try {
    const { notes, timestamps } = req.body;
    const updateData = { updatedAt: Date.now() };

    if (typeof notes === 'string') {
      updateData.notes = notes;
    }

    if (Array.isArray(timestamps)) {
      updateData.timestamps = timestamps;
    }

    const video = await Video.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateData,
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    return res.json({
      message: 'Notes saved successfully.',
      notes: video.notes,
      timestamps: video.timestamps,
      updatedAt: video.updatedAt
    });
  } catch (error) {
    console.error('Update notes error:', error);
    return res.status(500).json({ message: 'Failed to save notes.' });
  }
});

// Update playback progress (e.g. resume point)
router.patch('/:id/progress', async (req, res) => {
  try {
    const { position } = req.body;
    const video = await Video.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { 
        lastWatchedPosition: position || 0,
        lastWatchedAt: Date.now()
      },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    return res.json({ success: true, lastWatchedPosition: video.lastWatchedPosition });
  } catch (error) {
    console.error('Update progress error:', error);
    return res.status(500).json({ message: 'Failed to save progress.' });
  }
});

// Update video metadata (title, playlistId)
router.put('/:id', async (req, res) => {
  try {
    const { title, playlistId } = req.body;
    const updateData = { updatedAt: Date.now() };

    if (title && title.trim()) updateData.title = title.trim();
    if (playlistId !== undefined) updateData.playlistId = playlistId || null;

    const video = await Video.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateData,
      { new: true }
    ).populate('playlistId', 'title color category');

    if (!video) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    return res.json(video);
  } catch (error) {
    console.error('Update video error:', error);
    return res.status(500).json({ message: 'Failed to update video.' });
  }
});

// Reorder videos in playlist
router.post('/reorder', async (req, res) => {
  try {
    const { orderedIds } = req.body; // array of video IDs in order
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ message: 'orderedIds array is required.' });
    }

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, userId: req.user._id },
        update: { order: index }
      }
    }));

    if (bulkOps.length > 0) {
      await Video.bulkWrite(bulkOps);
    }

    return res.json({ message: 'Videos reordered successfully.' });
  } catch (error) {
    console.error('Reorder error:', error);
    return res.status(500).json({ message: 'Failed to reorder videos.' });
  }
});

// Delete video
router.delete('/:id', async (req, res) => {
  try {
    const video = await Video.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!video) {
      return res.status(404).json({ message: 'Video not found.' });
    }

    return res.json({ message: 'Video removed successfully.' });
  } catch (error) {
    console.error('Delete video error:', error);
    return res.status(500).json({ message: 'Failed to delete video.' });
  }
});

module.exports = router;
