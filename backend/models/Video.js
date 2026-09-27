const mongoose = require('mongoose');

const timestampSchema = new mongoose.Schema({
  time: {
    type: Number, // seconds
    required: true
  },
  label: {
    type: String,
    trim: true,
    default: ''
  },
  note: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: true });

const videoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  playlistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist',
    default: null,
    index: true
  },
  youtubeId: {
    type: String,
    required: [true, 'YouTube video ID is required'],
    trim: true
  },
  youtubeUrl: {
    type: String,
    required: [true, 'YouTube URL is required'],
    trim: true
  },
  title: {
    type: String,
    trim: true,
    default: 'YouTube Video'
  },
  channelTitle: {
    type: String,
    trim: true,
    default: ''
  },
  thumbnailUrl: {
    type: String,
    trim: true,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  },
  revisionStatus: {
    type: String,
    enum: ['need_revise', 'slight_revision', 'done', 'unwatched'],
    default: 'unwatched',
    index: true
  },
  notes: {
    type: String,
    default: ''
  },
  timestamps: [timestampSchema],
  lastWatchedPosition: {
    type: Number,
    default: 0
  },
  lastWatchedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

videoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Video', videoSchema);
