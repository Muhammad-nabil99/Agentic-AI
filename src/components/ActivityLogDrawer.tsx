import React from 'react';
import { X, Activity, CheckCircle, Clock, MessageSquare, Terminal, GitCommit } from 'lucide-react';
import type { ActivityLog } from '../types/office.ts';

interface ActivityLogDrawerProps {
  isOpen: boolean;
  logs: ActivityLog[];
  onClose: () => void;
  onClearLogs?: () => void;
}

export const ActivityLogDrawer: React.FC<ActivityLogDrawerProps> = ({
  isOpen,
  logs,
  onClose,
  onClearLogs,
}) => {
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-slide-left">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Activity Stream</h2>
            <p className="text-[11px] text-slate-500">Real-time team collaboration audit</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-lg"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close activity log"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No activity logged yet. Start a task to see live events!
          </div>
        ) : (
          logs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            return (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs transition-all hover:bg-slate-100/70"
              >
                <div className="mt-0.5 shrink-0 p-1 rounded-lg bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700">
                  {getLogIcon(log.type)}
                </div>

                <div className="flex-1 min-w-0">
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

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-center text-[11px] text-slate-500">
        Total events logged: {logs.length} • Autonomous multi-agent pipeline
      </div>
    </div>
  );
};
