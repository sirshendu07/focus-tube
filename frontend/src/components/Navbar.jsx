import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import PomodoroTimer from './PomodoroTimer';
import { 
  Tv, 
  ListVideo, 
  RotateCcw, 
  Plus, 
  LogOut, 
  User as UserIcon, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ 
  activeView, 
  setActiveView, 
  onOpenQuickAdd, 
  stats 
}) {
  const { user, isAuthenticated, logout, openAuth } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const revisionCount = (stats?.needRevise || 0) + (stats?.slightRevision || 0);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveView('player')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[1.5px] shadow-lg group-hover:glow-indigo transition-all">
            <div className="w-full h-full bg-[#0d121f] rounded-[10px] flex items-center justify-center">
              <Tv className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                FocusTube
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
                Zen
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">
              Zero Distraction Study Space
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm font-medium">
          <button
            onClick={() => setActiveView('player')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeView === 'player'
                ? 'bg-indigo-600 text-white shadow-md glow-indigo'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Focus Player</span>
          </button>

          <button
            onClick={() => setActiveView('playlists')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeView === 'playlists'
                ? 'bg-indigo-600 text-white shadow-md glow-indigo'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ListVideo className="w-4 h-4" />
            <span>Playlists</span>
            {stats?.playlistsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-800 text-slate-300">
                {stats.playlistsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('revision')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeView === 'revision'
                ? 'bg-indigo-600 text-white shadow-md glow-indigo'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Revision Queue</span>
            {revisionCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {revisionCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Action Icons & Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Paste & Add Video Button */}
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm shadow-md glow-emerald transition-all cursor-pointer"
            title="Paste any YouTube URL to watch distraction-free"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add / Paste Video</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* Pomodoro Timer */}
          <PomodoroTimer compact={true} />

          {/* User Auth Menu */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600/40 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-medium text-slate-200 hidden lg:inline max-w-[100px] truncate">
                  {user?.name || 'Account'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 p-2 rounded-2xl glass-panel shadow-2xl border border-slate-700/80 bg-[#0f172a] z-50 animate-fade-in text-slate-200"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  </div>

                  <div className="py-2 text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between px-3 py-1">
                      <span>Total Videos:</span>
                      <span className="font-semibold text-white">{stats?.totalVideos || 0}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1">
                      <span>Done:</span>
                      <span className="font-semibold text-emerald-400">{stats?.done || 0}</span>
                    </div>
                    <div className="flex justify-between px-3 py-1">
                      <span>Need Revision:</span>
                      <span className="font-semibold text-rose-400">{stats?.needRevise || 0}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openAuth('login')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => openAuth('register')}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md glow-indigo transition-all cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80 bg-slate-950/90 text-xs">
        <button
          onClick={() => setActiveView('player')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
            activeView === 'player' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Player</span>
        </button>
        <button
          onClick={() => setActiveView('playlists')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg ${
            activeView === 'playlists' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <ListVideo className="w-4 h-4" />
          <span>Playlists</span>
        </button>
        <button
          onClick={() => setActiveView('revision')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg relative ${
            activeView === 'revision' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Revision</span>
          {revisionCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>
      </div>
    </header>
  );
}
