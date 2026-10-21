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
  Sparkles,
  Building2,
  Sliders,
  X,
} from 'lucide-react';
import type { CameraView, GlassTintPreset, LightingTheme, WindowConfig } from '../types/office.ts';

interface ControlDockProps {
  speed: number;
  isPaused: boolean;
  soundEnabled: boolean;
  theme: LightingTheme;
  cameraView: CameraView;
  windowConfig: WindowConfig;
  onChangeWindowConfig: (config: WindowConfig) => void;
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
  windowConfig,
  onChangeWindowConfig,
  onTogglePlay,
  onChangeSpeed,
  onToggleSound,
  onChangeTheme,
  onChangeCamera,
  onOpenNewTask,
  onOpenFeed,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isWindowSettingsOpen, setIsWindowSettingsOpen] = useState(false);

  const handleOpacityChange = (val: number) => {
    onChangeWindowConfig({ ...windowConfig, glassOpacity: val });
  };

  const handleDepthChange = (val: number) => {
    onChangeWindowConfig({ ...windowConfig, skylineDepth: val });
  };

  const handleGlowChange = (val: number) => {
    onChangeWindowConfig({ ...windowConfig, windowGlow: val });
  };

  const handleTintChange = (tint: GlassTintPreset) => {
    onChangeWindowConfig({ ...windowConfig, glassTint: tint });
  };

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

      {/* Floating Window & Skyline Settings Drawer */}
      {!isCollapsed && isWindowSettingsOpen && (
        <div className="pointer-events-auto mb-2 bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Panoramic Glass & City Skyline Settings</span>
            </div>
            <button
              onClick={() => setIsWindowSettingsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
              aria-label="Close window settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
            {/* Slider 1: Glass Transparency */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <span>Glass Clarity</span>
                <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                  {Math.round((1 - windowConfig.glassOpacity) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.12"
                max="0.85"
                step="0.05"
                value={windowConfig.glassOpacity}
                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                <span>Crystal Clear</span>
                <span>Dark Tinted</span>
              </div>
            </div>

            {/* Slider 2: Skyline Depth */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <span>Skyline Distance</span>
                <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                  {windowConfig.skylineDepth.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={windowConfig.skylineDepth}
                onChange={(e) => handleDepthChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                <span>Urban Mist</span>
                <span>Infinite Vista</span>
              </div>
            </div>

            {/* Slider 3: City Window Glow */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <span>Building Lights Glow</span>
                <span className="font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                  {Math.round(windowConfig.windowGlow * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.2"
                step="0.1"
                value={windowConfig.windowGlow}
                onChange={(e) => handleGlowChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                <span>Muted</span>
                <span>Radiant</span>
              </div>
            </div>
          </div>

          {/* Quick Glass Tint Presets */}
          <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Glass Tint Style:
            </span>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'auto', label: 'Auto (Theme)' },
                  { id: 'clear', label: 'Pure Clear' },
                  { id: 'azure', label: 'Azure Blue' },
                  { id: 'obsidian', label: 'Obsidian Smoke' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleTintChange(preset.id)}
                  className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-all ${
                    windowConfig.glassTint === preset.id
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
            {/* Window & Skyline Customization Button */}
            <button
              onClick={() => setIsWindowSettingsOpen(!isWindowSettingsOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                isWindowSettingsOpen
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Adjust Window Glass & Skyline"
              aria-label="Adjust Window Glass & Skyline"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Skyline</span>
              <Sliders className="w-3 h-3 opacity-70" />
            </button>

            {/* Theme Toggle (Morning, Sunset, Night, Cyberpunk) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => onChangeTheme('daylight')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  theme === 'daylight'
                    ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Morning Theme (Daylight)"
                aria-label="Set morning theme"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Morning</span>
              </button>
              <button
                onClick={() => onChangeTheme('sunset')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  theme === 'sunset'
                    ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Sunset Theme (Golden Hour)"
                aria-label="Set sunset theme"
              >
                <Sunset className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Sunset</span>
              </button>
              <button
                onClick={() => onChangeTheme('night')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  theme === 'night'
                    ? 'bg-white dark:bg-slate-700 text-sky-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Night Theme (Desk Lamps On)"
                aria-label="Set night theme"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Night</span>
              </button>
              <button
                onClick={() => onChangeTheme('cyberpunk')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                  theme === 'cyberpunk'
                    ? 'bg-white dark:bg-slate-700 text-purple-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Cyberpunk Theme (Neon Glow)"
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
