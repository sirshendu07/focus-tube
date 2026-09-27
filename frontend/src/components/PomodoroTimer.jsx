import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Coffee, Sparkles } from 'lucide-react';

export default function PomodoroTimer({ compact = false }) {
  const [mode, setMode] = useState('focus'); // 'focus' (25m), 'shortBreak' (5m), 'longBreak' (15m)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef(null);

  const MODES = {
    focus: { label: 'Focus Sprint', minutes: 25, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    shortBreak: { label: 'Short Rest', minutes: 5, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    longBreak: { label: 'Long Rest', minutes: 15, color: 'text-amber-400', bg: 'bg-amber-500/10' }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(MODES[newMode].minutes * 60);
    setIsRunning(false);
  };

  const resetTimer = () => {
    setTimeLeft(MODES[mode].minutes * 60);
    setIsRunning(false);
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            try {
              // Beep notification using web audio API
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
              osc.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.4);
            } catch {
              // ignore audio failure
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all cursor-pointer ${
            isRunning
              ? 'bg-indigo-950/70 border-indigo-500/50 text-indigo-300 shadow-sm glow-indigo'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          title="Study Focus Timer"
        >
          <Clock className={`w-3.5 h-3.5 ${isRunning ? 'animate-pulse text-indigo-400' : 'text-slate-400'}`} />
          <span>{timeFormatted}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 p-4 rounded-2xl glass-panel shadow-2xl border border-slate-700/80 bg-[#0f172a] z-50 animate-fade-in text-slate-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Focus Pomodoro
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${MODES[mode].bg} ${MODES[mode].color} font-medium`}>
                {MODES[mode].label}
              </span>
            </div>

            <div className="text-center py-2">
              <div className="text-4xl font-mono font-bold tracking-tight text-white mb-3">
                {timeFormatted}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md glow-indigo cursor-pointer transition-all"
                >
                  {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isRunning ? 'Pause' : 'Start'}</span>
                </button>
                <button
                  onClick={resetTimer}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs cursor-pointer transition-all"
                  title="Reset"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Mode switch */}
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800/80 text-[11px]">
                <button
                  onClick={() => switchMode('focus')}
                  className={`py-1 rounded-lg cursor-pointer transition-all ${
                    mode === 'focus' ? 'bg-indigo-600/30 text-indigo-300 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  25m Study
                </button>
                <button
                  onClick={() => switchMode('shortBreak')}
                  className={`py-1 rounded-lg cursor-pointer transition-all ${
                    mode === 'shortBreak' ? 'bg-emerald-600/30 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  5m Break
                </button>
                <button
                  onClick={() => switchMode('longBreak')}
                  className={`py-1 rounded-lg cursor-pointer transition-all ${
                    mode === 'longBreak' ? 'bg-amber-600/30 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  15m Rest
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl glass-card border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-indigo-400" /> Focus Sprint Timer
        </span>
        <span className={`text-xs px-2.5 py-0.5 rounded-full ${MODES[mode].bg} ${MODES[mode].color} font-medium`}>
          {MODES[mode].label}
        </span>
      </div>

      <div className="text-center my-3">
        <div className="text-5xl font-mono font-bold tracking-tight text-white mb-4">
          {timeFormatted}
        </div>

        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg glow-indigo cursor-pointer transition-all"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? 'Pause Timer' : 'Start Focus Sprint'}</span>
          </button>
          <button
            onClick={resetTimer}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-all"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-center gap-2 text-xs">
          <button
            onClick={() => switchMode('focus')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
              mode === 'focus' ? 'bg-indigo-600 text-white font-medium' : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            25m Focus
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
              mode === 'shortBreak' ? 'bg-emerald-600 text-white font-medium' : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            5m Short Break
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
              mode === 'longBreak' ? 'bg-amber-600 text-white font-medium' : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            15m Long Break
          </button>
        </div>
      </div>
    </div>
  );
}
