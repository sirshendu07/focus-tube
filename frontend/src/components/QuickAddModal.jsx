import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Video, Plus, Sparkles, Check, Play, FolderPlus } from 'lucide-react';
import { extractYouTubeId } from '../utils/youtube';

export default function QuickAddModal({
  isOpen,
  onClose,
  playlists = [],
  onVideoAdded,
  defaultPlaylistId = null
}) {
  const { isAuthenticated, openAuth } = useAuth();
  const [url, setUrl] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(defaultPlaylistId || '');
  const [revisionStatus, setRevisionStatus] = useState('unwatched');
  const [customTitle, setCustomTitle] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New playlist inline creation
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');

  useEffect(() => {
    if (defaultPlaylistId) {
      setSelectedPlaylistId(defaultPlaylistId);
    }
  }, [defaultPlaylistId]);

  // Real-time URL validation and resilient preview
  useEffect(() => {
    const raw = url.trim();
    if (!raw) {
      setPreviewData(null);
      setError('');
      return;
    }

    const youtubeId = extractYouTubeId(raw);
    if (!youtubeId) {
      setPreviewData(null);
      if (raw.includes('playlist?list=') || raw.includes('/playlist')) {
        setError('This is a playlist URL. Please open any video in the playlist and paste its URL.');
      } else if (raw.length > 5) {
        setError('Could not detect a valid YouTube video in this link. Please check the URL.');
      } else {
        setError('');
      }
      return;
    }

    // Video ID found! Clear errors and set instant fallback preview
    setError('');
    const instantPreview = {
      youtubeId,
      title: customTitle || `YouTube Video (${youtubeId})`,
      channelTitle: 'YouTube Creator',
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    };
    setPreviewData(instantPreview);

    // Asynchronously enrich with real title & channel from oEmbed
    setLoadingPreview(true);
    const timer = setTimeout(async () => {
      try {
        const preview = await api.previewVideo(raw);
        if (preview && preview.title) {
          setPreviewData(preview);
          if (!customTitle) {
            setCustomTitle(preview.title);
          }
        }
      } catch (err) {
        // oEmbed enrichment error is non-fatal: user can still save and watch with default title & thumbnail
      } finally {
        setLoadingPreview(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [url]);

  if (!isOpen) return null;

  const handleCreateNewPlaylist = async () => {
    if (!newPlaylistTitle.trim()) return;
    try {
      const created = await api.createPlaylist({
        title: newPlaylistTitle.trim(),
        category: 'Learning'
      });
      playlists.push(created);
      setSelectedPlaylistId(created._id);
      setIsCreatingPlaylist(false);
      setNewPlaylistTitle('');
    } catch (err) {
      setError(err.message || 'Failed to create playlist');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }

    if (!url.trim()) {
      setError('Please provide a YouTube video URL or ID.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const newVideo = await api.createVideo({
        url: url.trim(),
        playlistId: selectedPlaylistId || null,
        title: customTitle.trim() || undefined,
        customNotes: customNotes.trim() || undefined,
        revisionStatus
      });

      // Clear form
      setUrl('');
      setPreviewData(null);
      setCustomTitle('');
      setCustomNotes('');
      setRevisionStatus('unwatched');
      onClose();

      if (onVideoAdded) {
        onVideoAdded(newVideo);
      }
    } catch (err) {
      if (err.data?.existingVideo) {
        onClose();
        if (onVideoAdded) {
          onVideoAdded(err.data.existingVideo);
        }
      } else {
        setError(err.message || 'Failed to save video. Please check the link and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg p-5 sm:p-8 rounded-2xl glass-panel shadow-2xl border border-slate-700/80 bg-[#0f172a] text-slate-100 max-h-[88vh] overflow-y-auto mx-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Zero Distraction Video Importer</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Add YouTube Video
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Paste any link (full URL, short link, or shorts). Enjoy without algorithmic recommendations!
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* YouTube Link Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              YouTube Video Link or ID
            </label>
            <div className="relative">
              <Video className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 text-sm outline-none transition-all"
              />
            </div>
            {loadingPreview && (
              <p className="text-xs text-indigo-400 mt-1.5 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Fetching video details from YouTube...
              </p>
            )}
          </div>

          {/* Video Preview Card if detected */}
          {previewData && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <img
                src={previewData.thumbnailUrl}
                alt="Thumbnail"
                className="w-full sm:w-28 aspect-video object-cover rounded-lg border border-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white line-clamp-2 leading-tight">
                  {previewData.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 truncate">
                  Channel: {previewData.channelTitle}
                </p>
              </div>
            </div>
          )}

          {/* Playlist selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Save into Playlist
              </label>
              {!isCreatingPlaylist && (
                <button
                  type="button"
                  onClick={() => setIsCreatingPlaylist(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <FolderPlus className="w-3 h-3" />
                  <span>+ New Playlist</span>
                </button>
              )}
            </div>

            {isCreatingPlaylist ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New Playlist Title..."
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-indigo-500/50 text-white outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateNewPlaylist}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingPlaylist(false)}
                  className="px-2 py-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm outline-none focus:border-indigo-500"
              >
                <option value="">(Standalone / Quick Watch)</option>
                {playlists.map((p) => (
                  <option key={p._id} value={p._id}>
                    📁 {p.title} ({p.totalVideos || 0} videos)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Study & Revision Status Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Initial Revision Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRevisionStatus('unwatched')}
                className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  revisionStatus === 'unwatched'
                    ? 'bg-slate-800 border-slate-400 text-white font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ⚪ Unwatched
              </button>

              <button
                type="button"
                onClick={() => setRevisionStatus('need_revise')}
                className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  revisionStatus === 'need_revise'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-300 font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-rose-300'
                }`}
              >
                🔴 Need Revise
              </button>

              <button
                type="button"
                onClick={() => setRevisionStatus('slight_revision')}
                className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  revisionStatus === 'slight_revision'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-amber-300'
                }`}
              >
                🟡 Slight Revise
              </button>

              <button
                type="button"
                onClick={() => setRevisionStatus('done')}
                className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  revisionStatus === 'done'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-emerald-300'
                }`}
              >
                🟢 Done
              </button>
            </div>
          </div>

          {/* Initial Notes / Goals */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Initial Notes or Focus Goal (Optional)
            </label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Pay special attention to the Dijkstra graph proofs at 12:00..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg glow-indigo flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Save & Watch Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
