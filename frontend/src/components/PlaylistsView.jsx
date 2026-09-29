import React, { useState } from 'react';
import { api } from '../services/api';
import { 
  Plus, 
  Folder, 
  Play, 
  Trash2, 
  CheckCircle2, 
  RotateCcw, 
  Search, 
  FolderPlus,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function PlaylistsView({
  playlists = [],
  onSelectPlaylist,
  onPlayPlaylist,
  onPlaylistsChanged
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const categories = ['All', ...new Set(playlists.map(p => p.category || 'General'))];

  const filteredPlaylists = playlists.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    setError('');

    try {
      await api.createPlaylist({
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory.trim()
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewCategory('General');
      if (onPlaylistsChanged) onPlaylistsChanged();
    } catch (err) {
      setError(err.message || 'Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePlaylist = async (id, title, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${title}" and all its videos?`)) {
      try {
        await api.deletePlaylist(id);
        if (onPlaylistsChanged) onPlaylistsChanged();
      } catch (err) {
        alert(err.message || 'Failed to delete playlist');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-indigo-400" />
            <span>My Study Playlists</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Organize YouTube lectures into focused tracks with revision benchmarks.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="self-start md:self-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg glow-indigo flex items-center gap-2 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search playlists by title or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

        {categories.length > 2 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Playlists Grid */}
      {filteredPlaylists.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <FolderPlus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No playlists found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Create your first study playlist to start queuing up YouTube tutorials and tracking your revision.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md glow-indigo cursor-pointer"
          >
            Create First Playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaylists.map(playlist => {
            const total = playlist.totalVideos || 0;
            const done = playlist.doneVideos || 0;
            const needRevise = playlist.needReviseVideos || 0;
            const slightRevise = playlist.slightRevisionVideos || 0;
            const progress = playlist.progressPercentage || 0;

            return (
              <div
                key={playlist._id}
                onClick={() => onSelectPlaylist(playlist)}
                className="group relative p-6 rounded-2xl glass-card border border-slate-800 hover:border-slate-700/80 transition-all hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Category and Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
                      {playlist.category || 'General'}
                    </span>
                    <button
                      onClick={(e) => handleDeletePlaylist(playlist._id, playlist.title, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Delete Playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors mb-1.5 line-clamp-1">
                    {playlist.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 min-h-[32px]">
                    {playlist.description || 'No description provided.'}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1 font-mono">
                      <span className="text-slate-400">{done} of {total} videos done</span>
                      <span className="text-emerald-400 font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Revision Indicators */}
                  <div className="flex items-center gap-2 mb-4 text-xs font-medium">
                    {needRevise > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        {needRevise} need revise
                      </span>
                    )}
                    {slightRevise > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        {slightRevise} slight
                      </span>
                    )}
                    {total === 0 && (
                      <span className="text-slate-500 text-xs">Empty playlist</span>
                    )}
                  </div>
                </div>

                {/* Bottom Card Controls */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5" />
                    <span>{total} video{total === 1 ? '' : 's'}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {total > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayPlaylist(playlist);
                        }}
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm glow-emerald transition-all cursor-pointer"
                        title="Start watching playlist"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                      </button>
                    )}
                    <span className="text-xs text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Manage <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md p-5 sm:p-6 rounded-2xl glass-panel shadow-2xl border border-slate-700 bg-[#0f172a] text-slate-100 max-h-[90vh] overflow-y-auto mx-2">
            <h2 className="text-xl font-bold text-white mb-2">Create New Study Track</h2>
            <p className="text-xs text-slate-400 mb-4">
              Group related lectures or tutorials into a unified study collection.
            </p>

            {error && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Playlist Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford Algorithms CS161"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Category / Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science, Math, Exam Prep"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="What is the goal of this playlist?"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md glow-indigo cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Playlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
