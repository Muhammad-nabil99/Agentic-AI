import React, { useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sun,
  Sunset,
  Moon,
  ChevronDown,
  ChevronUp,
  Camera,
  FastForward,
  Info,
  Sparkles,
} from 'lucide-react';
import type { CameraView, LightingTheme } from '../types/office.ts';

interface ControlDockProps {
  speed: number;
  isPaused: boolean;
  soundEnabled: boolean;
  theme: LightingTheme;
  cameraView: CameraView;
  onTogglePlay: () => void;
  onChangeSpeed: (newSpeed: number) => void;
  onToggleSound: () => void;
  onChangeTheme: (theme: LightingTheme) => void;
  onChangeCamera: (cam: CameraView) => void;
  onOpenNewTask: () => void;
  onOpenFeed: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  speed,
  isPaused,
  soundEnabled,
  theme,
  cameraView,
  onTogglePlay,
  onChangeSpeed,
  onToggleSound,
  onChangeTheme,
  onChangeCamera,
  onOpenNewTask,
  onOpenFeed,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-[94vw] sm:max-w-2xl px-2 pointer-events-none transition-transform duration-300 ease-in-out">
      {/* Collapse Toggle Handle */}
      <div className="flex justify-center mb-1 pointer-events-auto">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 shadow-md backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 transition-colors"
          aria-label={isCollapsed ? 'Show simulation controls' : 'Hide simulation controls'}
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-indigo-500" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
              <span>Hide Controls</span>
            </>
          )}
        </button>
      </div>

      {/* Main Unified Control Bar */}
      {!isCollapsed && (
        <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-2.5">
          {/* Group 1: Playback Controls */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl">
            <button
              onClick={onTogglePlay}
              className={`flex items-center justify-center w-8 h-8 rounded-lg font-medium transition-colors ${
                isPaused
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-indigo-600 text-white shadow-sm'
              }`}
              aria-label={isPaused ? 'Resume simulation' : 'Pause simulation'}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
            </button>

            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                  speed === s
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                aria-label={`Set speed to ${s}x`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Group 2: Camera View Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl overflow-x-auto max-w-full">
            <div className="flex items-center gap-1 px-1.5 text-slate-400 dark:text-slate-500">
              <Camera className="w-3.5 h-3.5" />
            </div>

            <button
              onClick={() => onChangeCamera('overview')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                cameraView === 'overview'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => onChangeCamera('planner')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                cameraView === 'planner'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shadow-sm border border-rose-200 dark:border-rose-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🗂️ Planner
            </button>

            <button
              onClick={() => onChangeCamera('coder')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                cameraView === 'coder'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200 dark:border-blue-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              💻 Coder
            </button>

            <button
              onClick={() => onChangeCamera('reviewer')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                cameraView === 'reviewer'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-200 dark:border-emerald-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🔍 Reviewer
            </button>

            <button
              onClick={() => onChangeCamera('cinematic')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                cameraView === 'cinematic'
                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shadow-sm border border-purple-200 dark:border-purple-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🎥 Orbit
            </button>
          </div>

          {/* Group 3: Utility & Theme Controls */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Theme Toggle (Pagi, Sore, Malam, Cyberpunk) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => onChangeTheme('daylight')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  theme === 'daylight'
                    ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Tema Pagi (Daylight)"
                aria-label="Set daylight theme"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Pagi</span>
              </button>
              <button
                onClick={() => onChangeTheme('sunset')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  theme === 'sunset'
                    ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Tema Sore (Sunset)"
                aria-label="Set sunset theme"
              >
                <Sunset className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Sore</span>
              </button>
              <button
                onClick={() => onChangeTheme('night')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  theme === 'night'
                    ? 'bg-white dark:bg-slate-700 text-sky-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Tema Malam (Night)"
                aria-label="Set night theme"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Malam</span>
              </button>
              <button
                onClick={() => onChangeTheme('cyberpunk')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  theme === 'cyberpunk'
                    ? 'bg-white dark:bg-slate-700 text-purple-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Tema Cyberpunk (Neon)"
                aria-label="Set cyberpunk theme"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Cyberpunk</span>
              </button>
            </div>

            {/* Sound Mute Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-xl transition-colors ${
                soundEnabled
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              }`}
              title={soundEnabled ? 'Mute audio' : 'Unmute audio'}
              aria-label={soundEnabled ? 'Mute audio' : 'Unmute audio'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Quick Add Task Button */}
            <button
              onClick={onOpenNewTask}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>+ Add Task</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
