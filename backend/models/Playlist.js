const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Playlist title is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    default: '',
    maxlength: 500
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  color: {
    type: String,
    default: '#6366f1' // indigo
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

playlistSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Playlist', playlistSchema);
