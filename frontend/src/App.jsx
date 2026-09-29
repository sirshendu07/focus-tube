import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import Navbar from './components/Navbar';
import FocusPlayer from './components/FocusPlayer';
import PlaylistsView from './components/PlaylistsView';
import PlaylistDetailView from './components/PlaylistDetailView';
import RevisionQueueView from './components/RevisionQueueView';
import QuickAddModal from './components/QuickAddModal';
import AuthModal from './components/AuthModal';
import { extractYouTubeId } from './utils/youtube';
import { Play, Sparkles, Tv, Layers, RotateCcw, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  const { user, isAuthenticated, loading, openAuth } = useAuth();
  
  // Navigation & Active States
  const [activeView, setActiveView] = useState('player'); // 'player' | 'playlists' | 'playlistDetail' | 'revision'
  const [currentVideo, setCurrentVideo] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  
  // Data
  const [playlists, setPlaylists] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Quick Add Modal
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddDefaultPlaylist, setQuickAddDefaultPlaylist] = useState(null);

  // Quick Watch Input for Guests/Quick start
  const [instantUrl, setInstantUrl] = useState('');
  const [instantError, setInstantError] = useState('');
  const [instantLoading, setInstantLoading] = useState(false);

  // Fetch Playlists & Stats
  const loadData = useCallback(async () => {
    if (!isAuthenticated) {
      setPlaylists([]);
      setStats(null);
      return;
    }

    try {
      const [playlistsData, meData] = await Promise.all([
        api.getPlaylists(),
        api.getMe()
      ]);
      setPlaylists(playlistsData || []);
      setStats(meData?.user?.stats || null);
    } catch (err) {
      console.error('Failed to load user playlists and stats:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When user signs in, if no video is playing, fetch their first video or playlist
  useEffect(() => {
    if (isAuthenticated && !currentVideo) {
      api.getVideos().then(videos => {
        if (videos && videos.length > 0) {
          setCurrentVideo(videos[0]);
          if (videos[0].playlistId) {
            setCurrentPlaylist(videos[0].playlistId);
          }
        }
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  // Play a specific video
  const handlePlayVideo = async (video, playlist = null, videosList = []) => {
    setCurrentVideo(video);
    setCurrentPlaylist(playlist || video.playlistId || null);

    if (videosList && videosList.length > 0) {
      setPlaylistVideos(videosList);
    } else if (playlist?._id || video.playlistId?._id) {
      const pId = playlist?._id || video.playlistId?._id;
      try {
        const pData = await api.getPlaylist(pId);
        setPlaylistVideos(pData.videos || []);
      } catch {
        setPlaylistVideos([video]);
      }
    } else {
      setPlaylistVideos([video]);
    }

    setActiveView('player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Play an entire playlist (starts at first video)
  const handlePlayPlaylist = async (playlist) => {
    try {
      const data = await api.getPlaylist(playlist._id);
      if (data.videos && data.videos.length > 0) {
        // Pick first unwatched, or first
        const unwatched = data.videos.find(v => v.revisionStatus === 'unwatched') || data.videos[0];
        handlePlayVideo(unwatched, playlist, data.videos);
      } else {
        // Playlist empty, open add modal
        handleOpenQuickAdd(playlist._id);
      }
    } catch (err) {
      console.error('Failed to play playlist:', err);
    }
  };

  // Inspect playlist details
  const handleSelectPlaylist = (playlist) => {
    setSelectedPlaylistId(playlist._id);
    setActiveView('playlistDetail');
  };

  // Open Quick Add Modal
  const handleOpenQuickAdd = (playlistId = null) => {
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }
    setQuickAddDefaultPlaylist(playlistId);
    setQuickAddOpen(true);
  };

  // Callback when a video is added
  const handleVideoAdded = (newVideo) => {
    loadData();
    handlePlayVideo(newVideo, newVideo.playlistId);
  };

  // Callback when a video is updated (revision status, notes)
  const handleVideoUpdated = (updatedVideo) => {
    setCurrentVideo(updatedVideo);
    loadData();
  };

  // Quick Watch without saving (or guest preview)
  const handleInstantWatch = async (e) => {
    e.preventDefault();
    const raw = instantUrl.trim();
    if (!raw) return;

    setInstantError('');

    const youtubeId = extractYouTubeId(raw);
    if (!youtubeId) {
      if (raw.includes('playlist?list=') || raw.includes('/playlist')) {
        setInstantError('This is a playlist URL. Please open any video in the playlist and paste its link.');
      } else {
        setInstantError('Could not detect a valid YouTube video in this link. Please check and try again.');
      }
      return;
    }

    setInstantLoading(true);

    try {
      if (isAuthenticated) {
        // Automatically save and open in FocusPlayer
        try {
          const newVideo = await api.createVideo({ url: raw });
          setInstantUrl('');
          handleVideoAdded(newVideo);
        } catch (saveErr) {
          // If already in collection or other error, still play it directly
          if (saveErr.data?.existingVideo) {
            handlePlayVideo(saveErr.data.existingVideo);
            setInstantUrl('');
          } else {
            const preview = await api.previewVideo(raw).catch(() => ({
              youtubeId,
              title: `YouTube Video (${youtubeId})`,
              channelTitle: 'YouTube Creator',
              thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
            }));
            const tempVideo = {
              _id: 'view-' + Date.now(),
              youtubeId,
              youtubeUrl: raw.startsWith('http') ? raw : `https://www.youtube.com/watch?v=${youtubeId}`,
              title: preview.title || `YouTube Video (${youtubeId})`,
              channelTitle: preview.channelTitle || 'YouTube Creator',
              thumbnailUrl: preview.thumbnailUrl || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
              revisionStatus: 'unwatched',
              notes: '',
              timestamps: []
            };
            setCurrentVideo(tempVideo);
            setPlaylistVideos([tempVideo]);
            setActiveView('player');
            setInstantUrl('');
          }
        }
      } else {
        // Guest mode: extract youtubeId and start playing immediately
        const tempVideo = {
          _id: 'guest-' + Date.now(),
          youtubeId,
          youtubeUrl: raw.startsWith('http') ? raw : `https://www.youtube.com/watch?v=${youtubeId}`,
          title: `YouTube Video (${youtubeId})`,
          channelTitle: 'YouTube Creator',
          thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
          revisionStatus: 'unwatched',
          notes: '',
          timestamps: []
        };
        setCurrentVideo(tempVideo);
        setPlaylistVideos([tempVideo]);
        setActiveView('player');
        setInstantUrl('');

        // Try to enrich metadata in background without blocking player
        api.previewVideo(raw).then(preview => {
          if (preview && preview.title) {
            setCurrentVideo(prev => prev?._id === tempVideo._id ? {
              ...prev,
              title: preview.title,
              channelTitle: preview.channelTitle,
              thumbnailUrl: preview.thumbnailUrl
            } : prev);
          }
        }).catch(() => {});
      }
    } catch (err) {
      setInstantError(err.message || 'Invalid YouTube URL. Please check and try again.');
    } finally {
      setInstantLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-[#f1f5f9] flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Top Navigation */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenQuickAdd={() => handleOpenQuickAdd()}
        stats={stats}
      />

      {/* Main Content Area (extra bottom padding on mobile for thumb navigation) */}
      <main className="flex-1 pb-24 md:pb-12">
        
        {/* Instant Paste Header Bar */}
        {activeView === 'player' && (
          <div className="border-b border-slate-800/80 bg-slate-900/40 py-2.5 sm:py-3 px-3 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleInstantWatch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste any YouTube URL (watch, live, shorts, share link)..."
                  value={instantUrl}
                  onChange={(e) => setInstantUrl(e.target.value)}
                  className="flex-1 min-w-0 px-3.5 sm:px-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={instantLoading}
                  className="px-3.5 sm:px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs sm:text-sm shadow-md glow-indigo flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {instantLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white shrink-0" />
                      <span className="hidden sm:inline">Watch Distraction-Free</span>
                      <span className="sm:hidden text-xs">Watch</span>
                    </>
                  )}
                </button>
              </form>
              {instantError && (
                <p className="text-xs text-rose-400 mt-1.5 pl-1">⚠️ {instantError}</p>
              )}
            </div>
          </div>
        )}

        {/* View Switching */}
        {activeView === 'player' && (
          <FocusPlayer
            video={currentVideo}
            playlist={currentPlaylist}
            playlistVideos={playlistVideos}
            onSelectVideo={(vid) => handlePlayVideo(vid, currentPlaylist, playlistVideos)}
            onVideoUpdated={handleVideoUpdated}
            onOpenQuickAdd={() => handleOpenQuickAdd()}
          />
        )}

        {activeView === 'playlists' && (
          <PlaylistsView
            playlists={playlists}
            onSelectPlaylist={handleSelectPlaylist}
            onPlayPlaylist={handlePlayPlaylist}
            onPlaylistsChanged={loadData}
          />
        )}

        {activeView === 'playlistDetail' && (
          <PlaylistDetailView
            playlistId={selectedPlaylistId}
            onBack={() => setActiveView('playlists')}
            onPlayVideo={handlePlayVideo}
            onOpenAddVideo={handleOpenQuickAdd}
          />
        )}

        {activeView === 'revision' && (
          <RevisionQueueView
            onPlayVideo={handlePlayVideo}
            stats={stats}
            onRefreshStats={loadData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500 mb-14 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">FocusTube</span>
            <span>—</span>
            <span>Distraction-free YouTube player with revision intelligence.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>🔴 Need Revision</span>
            <span>🟡 Slight Revision</span>
            <span>🟢 Done</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal />
      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        playlists={playlists}
        defaultPlaylistId={quickAddDefaultPlaylist}
        onVideoAdded={handleVideoAdded}
      />
    </div>
  );
}
