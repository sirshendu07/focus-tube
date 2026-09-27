import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Save, 
  Copy, 
  Download, 
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  ChevronRight, 
  ListVideo, 
  Bookmark, 
  ExternalLink,
  Sparkles,
  Video,
  Trash2,
  FileText
} from 'lucide-react';

export default function FocusPlayer({
  video,
  playlist,
  playlistVideos = [],
  onSelectVideo,
  onVideoUpdated,
  onOpenQuickAdd
}) {
  const [notes, setNotes] = useState(video?.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(true);
  const [revisionStatus, setRevisionStatus] = useState(video?.revisionStatus || 'unwatched');
  const [theaterMode, setTheaterMode] = useState(false);
  const [showPlaylistSidebar, setShowPlaylistSidebar] = useState(true);
  const [timestampInput, setTimestampInput] = useState('');
  const [timestampLabel, setTimestampLabel] = useState('');
  const [timestamps, setTimestamps] = useState(video?.timestamps || []);
  const [currentStartTime, setCurrentStartTime] = useState(0);

  // Sync state whenever active video changes
  useEffect(() => {
    if (video) {
      setNotes(video.notes || '');
      setRevisionStatus(video.revisionStatus || 'unwatched');
      setTimestamps(video.timestamps || []);
      setCurrentStartTime(video.lastWatchedPosition || 0);
      setNotesSaved(true);
    }
  }, [video?._id]);

  // Debounced auto-save for notes
  useEffect(() => {
    if (!video?._id) return;
    if (notes === (video.notes || '')) return;

    setNotesSaved(false);
    setSavingNotes(true);

    const timer = setTimeout(async () => {
      try {
        await api.updateNotes(video._id, { notes, timestamps });
        setNotesSaved(true);
        if (onVideoUpdated) {
          onVideoUpdated({ ...video, notes, timestamps });
        }
      } catch (err) {
        console.error('Failed to auto-save notes:', err);
      } finally {
        setSavingNotes(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [notes, timestamps, video?._id]);

  // Handle revision status click
  const handleSetRevisionStatus = async (status) => {
    if (!video?._id) return;
    const oldStatus = revisionStatus;
    setRevisionStatus(status);

    if (status === 'done' && oldStatus !== 'done') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // confetti fallback
      }
    }

    try {
      const updated = await api.updateRevisionStatus(video._id, status);
      if (onVideoUpdated) {
        onVideoUpdated(updated);
      }
    } catch (err) {
      console.error('Failed to update revision status:', err);
      setRevisionStatus(oldStatus);
    }
  };

  // Add a timestamp bookmark
  const handleAddTimestamp = async (e) => {
    e.preventDefault();
    if (!timestampInput.trim()) return;

    // Parse timestamp: "03:45" or "125"
    let seconds = 0;
    const parts = timestampInput.trim().split(':');
    if (parts.length === 2) {
      seconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    } else if (parts.length === 3) {
      seconds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
    } else {
      seconds = parseInt(timestampInput, 10) || 0;
    }

    const newTimestamp = {
      time: seconds,
      label: timestampLabel.trim() || `Bookmark at ${timestampInput}`,
      note: ''
    };

    const updatedTimestamps = [...timestamps, newTimestamp].sort((a, b) => a.time - b.time);
    setTimestamps(updatedTimestamps);
    setTimestampInput('');
    setTimestampLabel('');

    if (video?._id) {
      await api.updateNotes(video._id, { notes, timestamps: updatedTimestamps });
    }
  };

  const handleSeekTimestamp = (seconds) => {
    setCurrentStartTime(seconds);
  };

  const handleDeleteTimestamp = async (index) => {
    const updated = timestamps.filter((_, i) => i !== index);
    setTimestamps(updated);
    if (video?._id) {
      await api.updateNotes(video._id, { notes, timestamps: updated });
    }
  };

  // Copy notes to clipboard
  const handleCopyNotes = () => {
    let content = `# Notes for: ${video?.title || 'YouTube Video'}\n\n`;
    if (timestamps.length > 0) {
      content += `## Bookmarks / Timestamps\n`;
      timestamps.forEach(ts => {
        const m = Math.floor(ts.time / 60);
        const s = ts.time % 60;
        const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        content += `- [${timeStr}] ${ts.label}\n`;
      });
      content += `\n`;
    }
    content += `## Study Notes\n${notes}\n`;
    navigator.clipboard.writeText(content);
    alert('Notes copied to clipboard!');
  };

  // Download notes
  const handleDownloadNotes = () => {
    let content = `# Notes for: ${video?.title || 'YouTube Video'}\n`;
    content += `URL: ${video?.youtubeUrl}\n`;
    content += `Status: ${revisionStatus}\n\n`;
    if (timestamps.length > 0) {
      content += `### Timestamps:\n`;
      timestamps.forEach(ts => {
        const m = Math.floor(ts.time / 60);
        const s = ts.time % 60;
        const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        content += `- [${timeStr}] ${ts.label}\n`;
      });
      content += `\n`;
    }
    content += `### Notes:\n${notes}\n`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(video?.title || 'notes').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Navigation inside playlist
  const currentIndex = playlistVideos.findIndex(v => v._id === video?._id);
  const prevVideo = currentIndex > 0 ? playlistVideos[currentIndex - 1] : null;
  const nextVideo = currentIndex >= 0 && currentIndex < playlistVideos.length - 1 ? playlistVideos[currentIndex + 1] : null;

  // Empty state if no video selected
  if (!video) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center glow-indigo">
          <Video className="w-10 h-10 text-indigo-400" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
          Pure Focus YouTube Player
        </h1>
        <p className="text-base text-slate-400 max-w-xl mx-auto mb-8">
          Paste any YouTube URL to watch in high-definition without endless recommendations, comments, or distracting sidebars. Take timestamped notes & track revision status seamlessly.
        </p>

        <button
          onClick={onOpenQuickAdd}
          className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base shadow-xl glow-indigo transition-all cursor-pointer flex items-center gap-3 mx-auto"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>Paste YouTube Link to Watch</span>
        </button>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-5 rounded-2xl glass-card border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              🛡️
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Zero Recommendations</h3>
            <p className="text-xs text-slate-400">
              No suggested video feeds, no algorithmic traps, no clickbait rabbit holes.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-card border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
              📝
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Timestamped Notes</h3>
            <p className="text-xs text-slate-400">
              Bookmark crucial moments with clickable timestamps. Auto-saves as you study.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-card border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              🔄
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Revision Tracking</h3>
            <p className="text-xs text-slate-400">
              Mark topics as "Need Revision", "Slight Revision", or "Done" to master exams.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Construct isolated embed URL with strict parameters
  // rel=0 prevents related videos from external channels
  // modestbranding=1 minimizes YouTube branding
  // iv_load_policy=3 turns off annotations
  const embedUrl = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1&showinfo=0&fs=1&color=white${
    currentStartTime ? `&start=${currentStartTime}` : ''
  }`;

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all ${theaterMode ? 'max-w-none px-2 py-2' : ''}`}>
      
      {/* Top Bar / Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {playlist && (
            <span className="px-3 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 shrink-0">
              <ListVideo className="w-3.5 h-3.5" />
              <span>{playlist.title}</span>
              {playlistVideos.length > 0 && (
                <span className="text-indigo-400 font-mono">
                  ({currentIndex + 1}/{playlistVideos.length})
                </span>
              )}
            </span>
          )}

          <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-xl" title={video.title}>
            {video.title}
          </h2>
        </div>

        {/* Player Actions & Playlist Prev/Next */}
        <div className="flex items-center gap-2">
          {playlistVideos.length > 1 && (
            <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-0.5">
              <button
                disabled={!prevVideo}
                onClick={() => prevVideo && onSelectVideo(prevVideo)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer transition-colors"
                title="Previous Video"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={!nextVideo}
                onClick={() => nextVideo && onSelectVideo(nextVideo)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer transition-colors"
                title="Next Video"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={() => setTheaterMode(!theaterMode)}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              theaterMode 
                ? 'bg-indigo-600 border-indigo-500 text-white' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={theaterMode ? 'Exit Theater Mode' : 'Theater / Zen Mode'}
          >
            {theaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{theaterMode ? 'Standard' : 'Theater'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Video Player & Controls, Right Notes & Bookmarks */}
      <div className={`grid gap-6 ${theaterMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>
        
        {/* Left Column: Video & Revision Bar */}
        <div className={theaterMode ? 'w-full' : 'lg:col-span-8'}>
          {/* Distraction-Free Video Frame */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800">
            <iframe
              key={`${video.youtubeId}-${currentStartTime}`}
              src={embedUrl}
              title={video.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* Revision Status Controller Bar */}
          <div className="mt-4 p-4 rounded-2xl glass-card border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Study / Revision Status
              </span>
              <p className="text-xs text-slate-400">
                Mark your current comprehension level for this video
              </p>
            </div>

            {/* Revision Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetRevisionStatus('need_revise')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  revisionStatus === 'need_revise'
                    ? 'bg-rose-600 text-white shadow-md glow-rose scale-105'
                    : 'bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <span>Need Revision</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetRevisionStatus('slight_revision')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  revisionStatus === 'slight_revision'
                    ? 'bg-amber-600 text-white shadow-md glow-amber scale-105'
                    : 'bg-amber-950/40 text-amber-300 border border-amber-800/40 hover:bg-amber-900/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Slight Revision</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetRevisionStatus('done')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  revisionStatus === 'done'
                    ? 'bg-emerald-600 text-white shadow-md glow-emerald scale-105'
                    : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/60'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Done / Mastered</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetRevisionStatus('unwatched')}
                className={`px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  revisionStatus === 'unwatched'
                    ? 'bg-slate-700 text-white border border-slate-600'
                    : 'bg-slate-900/70 text-slate-400 hover:text-slate-200'
                }`}
              >
                Reset Status
              </button>
            </div>
          </div>

          {/* Video Metadata / Channel info */}
          <div className="mt-3 px-2 flex items-center justify-between text-xs text-slate-400">
            <span>Channel: <strong className="text-slate-300">{video.channelTitle || 'YouTube Creator'}</strong></span>
            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <span>Original YouTube Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Playlist mini list if in playlist and sidebar collapsed */}
          {playlistVideos.length > 0 && !showPlaylistSidebar && (
            <div className="mt-4 p-4 rounded-2xl glass-card border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <ListVideo className="w-4 h-4 text-indigo-400" /> Playlist Queue
                </span>
                <button
                  onClick={() => setShowPlaylistSidebar(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  Show in side panel
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {playlistVideos.map((v, i) => (
                  <button
                    key={v._id}
                    onClick={() => onSelectVideo(v)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl shrink-0 border transition-all cursor-pointer ${
                      v._id === video._id
                        ? 'bg-indigo-950/60 border-indigo-500/60 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-mono font-bold text-slate-500">#{i + 1}</span>
                    <img src={v.thumbnailUrl} alt="" className="w-12 h-8 object-cover rounded-md" />
                    <span className="text-xs font-medium max-w-[140px] truncate">{v.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Notes & Timestamps */}
        <div className={theaterMode ? 'w-full mt-4' : 'lg:col-span-4'}>
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col h-full min-h-[500px]">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-white">Video Study Notes</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  {savingNotes ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      Saving...
                    </>
                  ) : notesSaved ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Saved
                    </>
                  ) : (
                    'Unsaved'
                  )}
                </span>

                <button
                  onClick={handleCopyNotes}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Copy Notes"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleDownloadNotes}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Download Markdown Notes"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Timestamp Adder */}
            <div className="mb-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Bookmark className="w-3 h-3 text-indigo-400" />
                Add Clickable Timestamp Bookmark
              </span>
              <form onSubmit={handleAddTimestamp} className="flex gap-2">
                <input
                  type="text"
                  placeholder="03:45"
                  value={timestampInput}
                  onChange={(e) => setTimestampInput(e.target.value)}
                  className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white text-center outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Topic/Concept (e.g. Formula derivation)"
                  value={timestampLabel}
                  onChange={(e) => setTimestampLabel(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shrink-0"
                >
                  + Add
                </button>
              </form>

              {/* Timestamp List */}
              {timestamps.length > 0 && (
                <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {timestamps.map((ts, idx) => {
                    const m = Math.floor(ts.time / 60);
                    const s = ts.time % 60;
                    const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs group"
                      >
                        <button
                          type="button"
                          onClick={() => handleSeekTimestamp(ts.time)}
                          className="flex items-center gap-2 text-indigo-300 hover:text-indigo-200 cursor-pointer font-mono font-medium truncate"
                          title="Seek video to this timestamp"
                        >
                          <span className="px-1.5 py-0.5 rounded bg-indigo-600/30 text-indigo-300 text-[10px]">
                            {formatted}
                          </span>
                          <span className="truncate text-slate-300 font-sans">{ts.label}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTimestamp(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Markdown / Text Notes Editor */}
            <div className="flex-1 flex flex-col min-h-[220px]">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Take study notes here... Write down formulas, questions, reminders, and key concepts. Automatically saved to your account."
                className="w-full flex-1 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm font-sans leading-relaxed outline-none focus:border-indigo-500 resize-none transition-all"
              />
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>{notes.length} characters</span>
              <span>Markdown supported</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
