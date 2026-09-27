import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import { 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  FileText, 
  Search, 
  Bookmark, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function RevisionQueueView({
  onPlayVideo,
  stats,
  onRefreshStats
}) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all_revise'); // 'all_revise' | 'need_revise' | 'slight_revision' | 'done'
  const [search, setSearch] = useState('');

  const fetchVideos = async () => {
    try {
      setLoading(true);
      let statusQuery = '';
      if (filter === 'all_revise') statusQuery = 'revision_queue';
      else statusQuery = filter;

      const data = await api.getVideos({ status: statusQuery });
      setVideos(data || []);
    } catch (err) {
      console.error('Failed to fetch revision videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [filter]);

  const handleUpdateStatus = async (videoId, newStatus, e) => {
    e.stopPropagation();
    try {
      if (newStatus === 'done') {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      }
      await api.updateRevisionStatus(videoId, newStatus);
      // update local
      setVideos(prev => prev.map(v => v._id === videoId ? { ...v, revisionStatus: newStatus } : v));
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filteredVideos = videos.filter(v => {
    if (!search.trim()) return true;
    return v.title.toLowerCase().includes(search.toLowerCase()) ||
      (v.notes && v.notes.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Active Study Recall</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <RotateCcw className="w-7 h-7 text-amber-400" />
          <span>Revision Command Center</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Review, brush up, and test your memory on videos you previously marked for revision.
        </p>
      </div>

      {/* Metrics Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div 
          onClick={() => setFilter('need_revise')}
          className={`p-4 rounded-2xl glass-card border transition-all cursor-pointer ${
            filter === 'need_revise' 
              ? 'border-rose-500/80 bg-rose-950/20' 
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">
              Need Revision
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {stats?.needRevise || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Topics requiring deep re-study or practice
          </p>
        </div>

        <div 
          onClick={() => setFilter('slight_revision')}
          className={`p-4 rounded-2xl glass-card border transition-all cursor-pointer ${
            filter === 'slight_revision' 
              ? 'border-amber-500/80 bg-amber-950/20' 
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              Slight Revision
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {stats?.slightRevision || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Quick 5-minute memory refreshers
          </p>
        </div>

        <div 
          onClick={() => setFilter('done')}
          className={`p-4 rounded-2xl glass-card border transition-all cursor-pointer ${
            filter === 'done' 
              ? 'border-emerald-500/80 bg-emerald-950/20' 
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Mastered / Done
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {stats?.done || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Videos completely understood
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilter('all_revise')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-all ${
              filter === 'all_revise' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Pending Revision
          </button>
          <button
            onClick={() => setFilter('need_revise')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-all ${
              filter === 'need_revise' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            Need Revise
          </button>
          <button
            onClick={() => setFilter('slight_revision')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-all ${
              filter === 'slight_revision' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            Slight Revision
          </button>
          <button
            onClick={() => setFilter('done')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-all ${
              filter === 'done' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            Done
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search revision notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Videos List */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading revision list...</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-slate-800 bg-slate-900/20">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">All caught up!</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            No videos currently match this filter. As you watch study videos, tag them with "Need Revision" or "Slight Revision" to queue them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVideos.map(vid => {
            const isNeedRevise = vid.revisionStatus === 'need_revise';
            const isSlight = vid.revisionStatus === 'slight_revision';
            const isDone = vid.revisionStatus === 'done';

            return (
              <div
                key={vid._id}
                onClick={() => onPlayVideo(vid, vid.playlistId)}
                className="group p-4 rounded-2xl glass-card border border-slate-800 hover:border-slate-700/80 transition-all hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3.5 mb-3">
                    {/* Thumbnail */}
                    <div className="relative w-28 aspect-video rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-800">
                      <img
                        src={vid.thumbnailUrl || `https://img.youtube.com/vi/${vid.youtubeId}/hqdefault.jpg`}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-4 h-4 fill-white" />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      {vid.playlistId?.title && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 mb-1 inline-block">
                          📁 {vid.playlistId.title}
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                        {vid.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {vid.channelTitle}
                      </p>
                    </div>
                  </div>

                  {/* Notes Snippet if present */}
                  {vid.notes && (
                    <div className="mb-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold text-slate-500 mb-1">
                        <FileText className="w-3 h-3 text-indigo-400" />
                        <span>Saved Notes Excerpt:</span>
                      </div>
                      <p className="line-clamp-2 font-mono text-[11px] text-slate-300 leading-relaxed">
                        {vid.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  {/* Status Pill */}
                  <div className="flex items-center gap-1.5">
                    {isNeedRevise && (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                        Need Revise
                      </span>
                    )}
                    {isSlight && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Slight Revision
                      </span>
                    )}
                    {isDone && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Done
                      </span>
                    )}
                  </div>

                  {/* Quick Upgrade to Done */}
                  <div className="flex items-center gap-2">
                    {!isDone && (
                      <button
                        onClick={(e) => handleUpdateStatus(vid._id, 'done', e)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
                        title="Mark as Mastered"
                      >
                        ✓ Mark Done
                      </button>
                    )}
                    <button
                      onClick={() => onPlayVideo(vid, vid.playlistId)}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Watch</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
