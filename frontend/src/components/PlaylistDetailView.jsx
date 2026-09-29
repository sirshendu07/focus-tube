import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import { 
  ChevronLeft, 
  Play, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  RotateCcw, 
  FileText, 
  ArrowUp, 
  ArrowDown, 
  Sparkles,
  ExternalLink,
  Filter
} from 'lucide-react';

export default function PlaylistDetailView({
  playlistId,
  onBack,
  onPlayVideo,
  onOpenAddVideo
}) {
  const [playlist, setPlaylist] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchPlaylistData = async () => {
    try {
      setLoading(true);
      const data = await api.getPlaylist(playlistId);
      setPlaylist(data.playlist);
      setVideos(data.videos || []);
    } catch (err) {
      console.error('Failed to load playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (playlistId) {
      fetchPlaylistData();
    }
  }, [playlistId]);

  const handleUpdateStatus = async (videoId, status, e) => {
    e.stopPropagation();
    try {
      if (status === 'done') {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      }
      const updated = await api.updateRevisionStatus(videoId, status);
      setVideos(prev => prev.map(v => v._id === videoId ? { ...v, revisionStatus: updated.revisionStatus } : v));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteVideo = async (videoId, e) => {
    e.stopPropagation();
    if (window.confirm('Remove this video from playlist?')) {
      try {
        await api.deleteVideo(videoId);
        setVideos(prev => prev.filter(v => v._id !== videoId));
      } catch (err) {
        alert(err.message || 'Failed to remove video');
      }
    }
  };

  const handleMove = async (index, direction, e) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= videos.length) return;

    const newVideos = [...videos];
    const temp = newVideos[index];
    newVideos[index] = newVideos[targetIndex];
    newVideos[targetIndex] = temp;

    setVideos(newVideos);
    try {
      await api.reorderVideos(newVideos.map(v => v._id));
    } catch (err) {
      console.error('Failed to save video reordering:', err);
    }
  };

  const filteredVideos = videos.filter(v => {
    if (filterStatus === 'all') return true;
    return v.revisionStatus === filterStatus;
  });

  const total = videos.length;
  const doneCount = videos.filter(v => v.revisionStatus === 'done').length;
  const needReviseCount = videos.filter(v => v.revisionStatus === 'need_revise').length;
  const slightReviseCount = videos.filter(v => v.revisionStatus === 'slight_revision').length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading playlist...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">
        <p className="text-base text-white mb-4">Playlist not found or deleted.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold"
        >
          Return to Playlists
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white mb-6 cursor-pointer transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Playlists</span>
      </button>

      {/* Playlist Header Card */}
      <div className="p-6 sm:p-8 rounded-2xl glass-card border border-slate-800 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                {playlist.category || 'General'}
              </span>
              <span className="text-xs text-slate-400">
                {total} video{total === 1 ? '' : 's'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {playlist.title}
            </h1>
            {playlist.description && (
              <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                {playlist.description}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenAddVideo(playlist._id)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 border border-slate-700 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Video</span>
            </button>

            {videos.length > 0 && (
              <button
                onClick={() => onPlayVideo(videos[0], playlist, videos)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg glow-indigo flex items-center gap-2 cursor-pointer transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play Track</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress & Revision Metrics */}
        <div className="mt-6 pt-6 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2 text-xs">
            <span className="text-slate-400">
              Track Completion: <strong className="text-white">{doneCount} / {total} done</strong>
            </span>
            <div className="flex items-center gap-3">
              {needReviseCount > 0 && (
                <span className="text-rose-400 font-medium">🔴 {needReviseCount} Need Revise</span>
              )}
              {slightReviseCount > 0 && (
                <span className="text-amber-400 font-medium">🟡 {slightReviseCount} Slight Revise</span>
              )}
              <span className="text-emerald-400 font-bold">{progress}%</span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800/90 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>Videos in this Track</span>
          <span className="text-xs text-slate-500 font-normal font-mono">({filteredVideos.length})</span>
        </h2>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-all ${
              filterStatus === 'all' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('need_revise')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-all ${
              filterStatus === 'need_revise' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            Need Revise ({needReviseCount})
          </button>
          <button
            onClick={() => setFilterStatus('slight_revision')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-all ${
              filterStatus === 'slight_revision' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            Slight ({slightReviseCount})
          </button>
          <button
            onClick={() => setFilterStatus('done')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-all ${
              filterStatus === 'done' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            Done ({doneCount})
          </button>
        </div>
      </div>

      {/* Video Rows */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/20">
          <p className="text-xs text-slate-400 mb-3">No videos matching this filter.</p>
          <button
            onClick={() => onOpenAddVideo(playlist._id)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            + Add First Video
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVideos.map((vid, idx) => {
            return (
              <div
                key={vid._id}
                onClick={() => onPlayVideo(vid, playlist, videos)}
                className="group relative p-3 sm:p-4 rounded-2xl glass-card border border-slate-800 hover:border-slate-700/80 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  {/* Reorder arrows */}
                  <div className="flex flex-col gap-0.5 text-slate-500 opacity-60 group-hover:opacity-100">
                    <button
                      disabled={idx === 0}
                      onClick={(e) => handleMove(idx, 'up', e)}
                      className="p-1 hover:text-white disabled:opacity-20 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === filteredVideos.length - 1}
                      onClick={(e) => handleMove(idx, 'down', e)}
                      className="p-1 hover:text-white disabled:opacity-20 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail with play overlay */}
                  <div className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-800">
                    <img
                      src={vid.thumbnailUrl || `https://img.youtube.com/vi/${vid.youtubeId}/hqdefault.jpg`}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Title & Channel */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                      {vid.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 truncate">
                      {vid.channelTitle || 'YouTube Creator'}
                    </p>
                    {vid.notes && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400 mt-1.5 font-medium">
                        <FileText className="w-3 h-3" />
                        <span>Has study notes</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Controls: Revision Status Selector & Delete */}
                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2.5 sm:pt-0 border-t border-slate-800/80 sm:border-0 shrink-0">
                  <select
                    value={vid.revisionStatus || 'unwatched'}
                    onChange={(e) => handleUpdateStatus(vid._id, e.target.value, e)}
                    onClick={(e) => e.stopPropagation()}
                    className={`flex-1 sm:flex-none px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                      vid.revisionStatus === 'need_revise'
                        ? 'bg-rose-950/70 border-rose-500/80 text-rose-300'
                        : vid.revisionStatus === 'slight_revision'
                        ? 'bg-amber-950/70 border-amber-500/80 text-amber-300'
                        : vid.revisionStatus === 'done'
                        ? 'bg-emerald-950/70 border-emerald-500/80 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    <option value="unwatched">⚪ Unwatched</option>
                    <option value="need_revise">🔴 Need Revise</option>
                    <option value="slight_revision">🟡 Slight Revise</option>
                    <option value="done">🟢 Done</option>
                  </select>

                  <button
                    onClick={(e) => handleDeleteVideo(vid._id, e)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                    title="Remove from playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
