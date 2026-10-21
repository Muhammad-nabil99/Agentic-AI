import {
  ListTodo,
  CheckCircle2,
  Users,
  Activity,
  Plus,
  Layers,
  Sparkles,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import type { AgentId, AgentInfo, Task, LightingTheme } from '../types/office.ts';

interface HeaderProps {
  activeTask: Task | null;
  tasksCompletedCount: number;
  queueCount: number;
  activeAgentId: AgentId | null;
  agents: Record<AgentId, AgentInfo>;
  theme?: LightingTheme;
  onChangeTheme?: (theme: LightingTheme) => void;
  onOpenNewTask: () => void;
  onOpenFeed: () => void;
  onSelectAgent: (agentId: AgentId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTask,
  tasksCompletedCount,
  queueCount,
  activeAgentId,
  agents,
  theme,
  onChangeTheme,
  onOpenNewTask,
  onOpenFeed,
  onSelectAgent,
}) => {
  const activeAgent = activeAgentId ? agents[activeAgentId] : null;

  return (
    <header className="fixed top-3 left-3 right-3 z-30 pointer-events-none flex flex-wrap items-start justify-between gap-2.5">
      {/* Brand & Active Workflow Bar */}
      <div className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-3 shadow-xl backdrop-blur-md max-w-lg w-full sm:w-auto">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md font-bold text-sm">
            🏢
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                Agentic Office 3D
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Autonomous Team
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Three agents, three responsibilities, one autonomous flow.
            </p>
          </div>
        </div>

        {/* Live Active Task Progress */}
        {activeTask ? (
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[240px]">
                {activeTask.title}
              </span>
              <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                {activeTask.progress}%
              </span>
            </div>
            {/* Progress Track */}
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${activeTask.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <span>Stage:</span>
                <span className="uppercase font-bold text-slate-700 dark:text-slate-300">
                  {activeTask.status}
                </span>
              </span>
              {activeAgent && (
                <span className="flex items-center gap-1">
                  <span>Acting:</span>
                  <span className="font-semibold" style={{ color: activeAgent.colorCss }}>
                    {activeAgent.icon} {activeAgent.name}
                  </span>
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
            Waiting for next task to begin...
          </div>
        )}
      </div>

      {/* Team Roster & Quick Actions */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Agent Avatars / Quick Focus */}
        <div className="hidden md:flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 p-1.5 rounded-2xl shadow-xl backdrop-blur-md">
          {(Object.keys(agents) as AgentId[]).map((id) => {
            const ag = agents[id];
            const isSelected = activeAgentId === id;
            return (
              <button
                key={id}
                onClick={() => onSelectAgent(id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-slate-100 dark:bg-slate-800 shadow-sm'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
                title={`Inspect ${ag.name} (${ag.role})`}
              >
                <span>{ag.icon}</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{ag.name}</span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: ag.colorCss }}
                />
              </button>
            );
          })}
        </div>

        {/* Status Metrics Cards */}
        <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 px-3 py-2 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs" title="Tasks completed">
            <CheckCircle2 className="w-4 h-4" />
            <span>{tasksCompletedCount}</span>
          </div>

          <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs" title="Tasks queued">
            <ListTodo className="w-4 h-4" />
            <span>{queueCount}</span>
          </div>
        </div>

        {/* Quick Theme Filter (Morning, Sunset, Night, Cyberpunk) */}
        {onChangeTheme && theme && (
          <div className="hidden sm:flex items-center bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 p-1 rounded-2xl shadow-xl backdrop-blur-md">
            <button
              onClick={() => onChangeTheme('daylight')}
              className={`p-1.5 rounded-xl transition-all ${
                theme === 'daylight'
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Morning Theme (Daylight)"
              aria-label="Set morning theme"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChangeTheme('sunset')}
              className={`p-1.5 rounded-xl transition-all ${
                theme === 'sunset'
                  ? 'bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Sunset Theme (Golden Hour)"
              aria-label="Set sunset theme"
            >
              <Sunset className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChangeTheme('night')}
              className={`p-1.5 rounded-xl transition-all ${
                theme === 'night'
                  ? 'bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Night Theme (Desk Lamps On)"
              aria-label="Set night theme"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChangeTheme('cyberpunk')}
              className={`p-1.5 rounded-xl transition-all ${
                theme === 'cyberpunk'
                  ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Cyberpunk Theme (Neon Glow)"
              aria-label="Set cyberpunk theme"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Activity Feed Button */}
        <button
          onClick={onOpenFeed}
          className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 p-2.5 rounded-2xl shadow-xl backdrop-blur-md transition-colors text-slate-700 dark:text-slate-200 flex items-center gap-1.5 text-xs font-bold"
          aria-label="View activity logs and feed"
        >
          <Activity className="w-4 h-4 text-indigo-500" />
          <span className="hidden sm:inline">Activity</span>
        </button>

        {/* Add Task Button */}
        <button
          onClick={onOpenNewTask}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2.5 rounded-2xl shadow-xl transition-all font-bold text-xs flex items-center gap-1.5 active:scale-95"
          aria-label="Create new sprint task"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
};
