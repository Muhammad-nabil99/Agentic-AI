import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  CheckCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Terminal,
  GitCommit,
  Filter,
  ArrowRight,
  ListTodo,
  Sparkles,
  Camera,
  Layers,
  Flame,
  ChevronRight,
  User,
  RotateCcw,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import type { AgentId, AgentInfo, ActivityLog, Task, TaskPriority, LightingTheme } from '../types/office.ts';

interface ActivityLogDrawerProps {
  isOpen: boolean;
  logs: ActivityLog[];
  agents: Record<AgentId, AgentInfo>;
  activeTask: Task | null;
  taskQueue: Task[];
  completedTasks: Task[];
  initialAgentFilter?: AgentId | null;
  theme?: LightingTheme;
  onChangeTheme?: (theme: LightingTheme) => void;
  onClose: () => void;
  onClearLogs?: () => void;
  onFocusAgent?: (agentId: AgentId) => void;
}

type FilterMode = 'all' | AgentId | 'handoff';
type TaskListTab = 'queue' | 'completed';

export const ActivityLogDrawer: React.FC<ActivityLogDrawerProps> = ({
  isOpen,
  logs,
  agents,
  activeTask,
  taskQueue,
  completedTasks,
  initialAgentFilter = null,
  theme,
  onChangeTheme,
  onClose,
  onClearLogs,
  onFocusAgent,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterMode>(initialAgentFilter || 'all');
  const [taskListTab, setTaskListTab] = useState<TaskListTab>('queue');

  useEffect(() => {
    if (isOpen && initialAgentFilter) {
      setSelectedFilter(initialAgentFilter);
    }
  }, [isOpen, initialAgentFilter]);

  if (!isOpen) return null;

  // Determine currently selected agent info if filter is an agent
  const isAgentSelected = selectedFilter === 'planner' || selectedFilter === 'coder' || selectedFilter === 'reviewer';
  const selectedAgent: AgentInfo | null = isAgentSelected ? agents[selectedFilter as AgentId] : null;

  // Filter logs based on selection
  const filteredLogs = logs.filter((log) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'handoff') {
      return log.type === 'handoff' || (log.agentId && log.targetAgentId);
    }
    // Filter by specific agent
    return log.agentId === selectedFilter || log.targetAgentId === selectedFilter;
  });

  const getLogIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'task_created':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'planning':
        return <Activity className="w-4 h-4 text-rose-500" />;
      case 'handoff':
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case 'coding':
        return <Terminal className="w-4 h-4 text-blue-500" />;
      case 'review':
        return <GitCommit className="w-4 h-4 text-emerald-500" />;
      case 'task_completed':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
            <Flame className="w-2.5 h-2.5" /> Critical
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Low
          </span>
        );
    }
  };

  // Check if selected agent is currently working on the active task
  const isAgentActiveOnCurrentTask = (agentId: AgentId) => {
    if (!activeTask) return false;
    if (agentId === 'planner' && activeTask.status === 'planning') return true;
    if (agentId === 'coder' && activeTask.status === 'coding') return true;
    if (agentId === 'reviewer' && activeTask.status === 'reviewing') return true;
    return false;
  };

  const getStageTitle = (status: Task['status']) => {
    switch (status) {
      case 'planning':
        return 'Stage 1: Architecture & Specs (Planner)';
      case 'coding':
        return 'Stage 2: Implementation & Tests (Coder)';
      case 'reviewing':
        return 'Stage 3: QA & Security Audit (Reviewer)';
      case 'completed':
        return 'Stage Complete: Deployed to Main';
      case 'queued':
      default:
        return 'In Queue';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg md:max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-slide-left">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Activity & Workflow</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Live Audit
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Filter agent work & monitor sprint pipelines in real time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Theme Buttons inside Activity drawer */}
          {onChangeTheme && theme && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 mr-1">
              <button
                onClick={() => onChangeTheme('daylight')}
                className={`p-1.5 rounded-lg transition-all ${
                  theme === 'daylight'
                    ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Morning Theme (Daylight)"
                aria-label="Set morning theme"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onChangeTheme('sunset')}
                className={`p-1.5 rounded-lg transition-all ${
                  theme === 'sunset'
                    ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Sunset Theme (Golden Hour)"
                aria-label="Set sunset theme"
              >
                <Sunset className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onChangeTheme('night')}
                className={`p-1.5 rounded-lg transition-all ${
                  theme === 'night'
                    ? 'bg-white dark:bg-slate-700 text-sky-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Night Theme (Desk Lamps On)"
                aria-label="Set night theme"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onChangeTheme('cyberpunk')}
                className={`p-1.5 rounded-lg transition-all ${
                  theme === 'cyberpunk'
                    ? 'bg-white dark:bg-slate-700 text-purple-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Cyberpunk Theme (Neon Glow)"
                aria-label="Set cyberpunk theme"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Clear logs"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close activity panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Bar Antar Kerja Tiap-Tiap Agent */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-indigo-500" />
            <span>Workflow Filter:</span>
          </span>
          {selectedFilter !== 'all' && (
            <button
              onClick={() => setSelectedFilter('all')}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset filter</span>
            </button>
          )}
        </div>

        {/* Filter Pills / Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${selectedFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 border border-slate-200 dark:border-slate-700'
              }`}
          >
            <span>All</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedFilter === 'all'
                  ? 'bg-indigo-700 text-indigo-100'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
            >
              {logs.length}
            </span>
          </button>

          {(['planner', 'coder', 'reviewer'] as AgentId[]).map((aid) => {
            const agent = agents[aid];
            const isSelected = selectedFilter === aid;
            const agentLogCount = logs.filter((l) => l.agentId === aid || l.targetAgentId === aid).length;

            return (
              <button
                key={aid}
                onClick={() => setSelectedFilter(aid)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${isSelected
                    ? 'shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 border-slate-200 dark:border-slate-700'
                  }`}
                style={
                  isSelected
                    ? {
                      backgroundColor: `${agent.colorCss}20`,
                      borderColor: agent.colorCss,
                      color: agent.colorCss,
                    }
                    : {}
                }
              >
                <span>{agent.icon}</span>
                <span>{agent.name}</span>
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded-full"
                  style={
                    isSelected
                      ? { backgroundColor: `${agent.colorCss}35`, color: agent.colorCss }
                      : { backgroundColor: 'rgba(100, 116, 139, 0.15)' }
                  }
                >
                  {agentLogCount}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setSelectedFilter('handoff')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${selectedFilter === 'handoff'
                ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 border-slate-200 dark:border-slate-700'
              }`}
          >
            <span>🤝</span>
            <span>Inter-Agent Handoffs</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* If an Agent is Clicked / Selected */}
        {selectedAgent && (
          <div className="space-y-4 animate-fade-in">
            {/* Agent Header Profile Card */}
            <div
              className="p-3.5 rounded-2xl border transition-all"
              style={{
                backgroundColor: `${selectedAgent.colorCss}10`,
                borderColor: `${selectedAgent.colorCss}35`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-md border"
                    style={{
                      backgroundColor: `${selectedAgent.colorCss}25`,
                      borderColor: selectedAgent.colorCss,
                    }}
                  >
                    {selectedAgent.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {selectedAgent.name}
                      </h3>
                      <span
                        className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${selectedAgent.colorCss}25`,
                          color: selectedAgent.colorCss,
                        }}
                      >
                        {isAgentActiveOnCurrentTask(selectedAgent.id)
                          ? '⚡ Working'
                          : activeTask
                            ? '⏳ In Queue'
                            : '☕ Standby'}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {selectedAgent.role}
                    </p>
                  </div>
                </div>

                {onFocusAgent && (
                  <button
                    onClick={() => onFocusAgent(selectedAgent.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-xs shrink-0"
                    title="Focus agent in 3D viewport"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Focus 3D</span>
                  </button>
                )}
              </div>

              {/* Speech & Live Action */}
              <div className="mt-3 p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Current Action:
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>💬</span>
                  <span className="italic">"{selectedAgent.speechText}"</span>
                </p>
              </div>

              {/* Agent Performance Metric Badges */}
              <div className="grid grid-cols-3 gap-2 mt-2.5">
                <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-center">
                  <span className="text-[10px] text-slate-500 block">Tasks Done</span>
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {selectedAgent.tasksCompleted}
                  </span>
                </div>
                {selectedAgent.id === 'coder' ? (
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-center">
                    <span className="text-[10px] text-slate-500 block">Lines of Code</span>
                    <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                      +{selectedAgent.linesOfCode}
                    </span>
                  </div>
                ) : selectedAgent.id === 'reviewer' ? (
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-center">
                    <span className="text-[10px] text-slate-500 block">Reviews Done</span>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      {selectedAgent.reviewsCompleted}
                    </span>
                  </div>
                ) : (
                  <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-center">
                    <span className="text-[10px] text-slate-500 block">Specs Authored</span>
                    <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                      {selectedAgent.tasksCompleted + (activeTask ? 1 : 0)}
                    </span>
                  </div>
                )}
                <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-center">
                  <span className="text-[10px] text-slate-500 block">Related Logs</span>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                    {filteredLogs.length}
                  </span>
                </div>
              </div>
            </div>

            {/* CURRENT TASK */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Current Active Task
                  </h4>
                </div>
                {activeTask && isAgentActiveOnCurrentTask(selectedAgent.id) && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Active at {selectedAgent.name}'s Desk
                  </span>
                )}
              </div>

              {activeTask ? (
                <div className="space-y-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {activeTask.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {activeTask.description}
                      </p>
                    </div>
                    {getPriorityBadge(activeTask.priority)}
                  </div>

                  {/* Stage Flow Indicator */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/80">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                      <span>{getStageTitle(activeTask.status)}</span>
                      <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        {activeTask.progress}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${activeTask.progress}%` }}
                      ></div>
                    </div>

                    {/* Stage Pipeline Steps */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                      <span
                        className={`flex items-center gap-1 font-semibold ${activeTask.status === 'planning'
                            ? 'text-rose-600 dark:text-rose-400 font-bold'
                            : activeTask.progress > 35
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          }`}
                      >
                        🗂️ Planning
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                      <span
                        className={`flex items-center gap-1 font-semibold ${activeTask.status === 'coding'
                            ? 'text-blue-600 dark:text-blue-400 font-bold'
                            : activeTask.progress > 75
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          }`}
                      >
                        💻 Coding
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                      <span
                        className={`flex items-center gap-1 font-semibold ${activeTask.status === 'reviewing'
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                            : activeTask.progress === 100
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          }`}
                      >
                        🔍 QA Review
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No sprint tasks currently in progress
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Agent {selectedAgent.name} is on standby waiting for the next sprint.
                  </p>
                </div>
              )}
            </div>

            {/* LIST TASK */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-indigo-500" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Task Pipelines ({selectedAgent.name})
                  </h4>
                </div>

                {/* Sub tabs: Queued vs Completed */}
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-700/80 text-[10px]">
                  <button
                    onClick={() => setTaskListTab('queue')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${taskListTab === 'queue'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                  >
                    Queued ({taskQueue.length})
                  </button>
                  <button
                    onClick={() => setTaskListTab('completed')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${taskListTab === 'completed'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                  >
                    Completed ({completedTasks.length})
                  </button>
                </div>
              </div>

              {/* Tasks List Content */}
              {taskListTab === 'queue' ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                  {taskQueue.length === 0 ? (
                    <div className="text-center py-6 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                      Task queue is empty. Add a new sprint task to begin!
                    </div>
                  ) : (
                    taskQueue.map((task, idx) => (
                      <div
                        key={task.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs transition-all hover:border-indigo-300 dark:hover:border-indigo-700"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                              {task.title}
                            </span>
                          </div>
                          {getPriorityBadge(task.priority)}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {task.description}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                          <span>Flow: Planner ➔ Coder ➔ Reviewer</span>
                          <span className="font-mono">Waiting in queue</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                  {completedTasks.length === 0 ? (
                    <div className="text-center py-6 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                      No tasks completed yet. Completed and deployed sprints will appear here!
                    </div>
                  ) : (
                    completedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{task.title}</span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                            100% Deployed
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {task.description}
                        </p>
                        {task.completedAt && (
                          <div className="mt-1 text-[10px] text-slate-400 font-mono">
                            Completed:{' '}
                            {new Date(task.completedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* When "all" is Selected, Show Interactive Agent Quick Cards */}
        {selectedFilter === 'all' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>Select an Agent to Inspect Tasks & Metrics:</span>
              </span>
            </div>

            {/* 3 Clickable Agent Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(['planner', 'coder', 'reviewer'] as AgentId[]).map((aid) => {
                const agent = agents[aid];
                const isActiveWorker = isAgentActiveOnCurrentTask(aid);

                return (
                  <button
                    key={aid}
                    onClick={() => setSelectedFilter(aid)}
                    className="p-3 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer shadow-xs"
                    style={{
                      backgroundColor: `${agent.colorCss}0e`,
                      borderColor: `${agent.colorCss}35`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-lg border shadow-xs"
                        style={{
                          backgroundColor: `${agent.colorCss}20`,
                          borderColor: agent.colorCss,
                        }}
                      >
                        {agent.icon}
                      </div>
                      <ChevronRight
                        className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                        style={{ color: agent.colorCss }}
                      />
                    </div>
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {agent.name}
                    </div>
                    <div className="text-[10px] text-slate-500 line-clamp-1">
                      {agent.role}
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${agent.colorCss}20`,
                          color: agent.colorCss,
                        }}
                      >
                        {isActiveWorker ? '⚡ Active' : 'View Tasks'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {agent.tasksCompleted} done
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Task Banner if running */}
            {activeTask && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Active Sprint Pipeline:</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {activeTask.progress}%
                  </span>
                </div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {activeTask.title}
                </h5>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {getStageTitle(activeTask.status)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* When "handoff" is Selected, Show Inter-agent Handoffs */}
        {selectedFilter === 'handoff' && (
          <div className="p-3.5 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/80">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🤝</span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Inter-Agent Collaboration & Handoffs
              </h4>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Audit technical specification handoffs, feature implementations, PR reviews, and automated agent coordination.
            </p>
          </div>
        )}

        {/* Activity Logs Stream Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-indigo-500" />
              <span>
                {selectedFilter === 'all'
                  ? 'Overall Activity Audit Trail'
                  : selectedFilter === 'handoff'
                    ? 'Inter-Agent Handoff History'
                    : `Activity History: ${selectedAgent?.name}`}
              </span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {filteredLogs.length} events
            </span>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No activity logs recorded for this filter yet.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              const logAgent = log.agentId ? agents[log.agentId] : null;
              const targetAgent = log.targetAgentId ? agents[log.targetAgentId] : null;

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs transition-all hover:bg-slate-100/70 dark:hover:bg-slate-800/80"
                >
                  <div className="mt-0.5 shrink-0 p-1.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700">
                    {getLogIcon(log.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Inter-agent badges or single agent badge */}
                    {(logAgent || targetAgent) && (
                      <div className="flex items-center gap-1.5 mb-1">
                        {logAgent && (
                          <button
                            onClick={() => setSelectedFilter(logAgent.id)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-all hover:opacity-80"
                            style={{
                              backgroundColor: `${logAgent.colorCss}18`,
                              borderColor: `${logAgent.colorCss}40`,
                              color: logAgent.colorCss,
                            }}
                            title={`Filter by ${logAgent.name}`}
                          >
                            <span>{logAgent.icon}</span>
                            <span>{logAgent.name}</span>
                          </button>
                        )}

                        {targetAgent && (
                          <>
                            <ArrowRight className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <button
                              onClick={() => setSelectedFilter(targetAgent.id)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-all hover:opacity-80"
                              style={{
                                backgroundColor: `${targetAgent.colorCss}18`,
                                borderColor: `${targetAgent.colorCss}40`,
                                color: targetAgent.colorCss,
                              }}
                              title={`Filter by ${targetAgent.name}`}
                            >
                              <span>{targetAgent.icon}</span>
                              <span>{targetAgent.name}</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {log.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {timeStr}
                      </span>
                    </div>

                    {log.detail && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {log.detail}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-[11px] text-slate-500">
        <span>Autonomous multi-agent pipeline</span>
        <span className="font-mono">{filteredLogs.length} events filtered</span>
      </div>
    </div>
  );
};
