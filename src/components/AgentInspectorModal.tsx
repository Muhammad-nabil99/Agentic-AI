import { X, Camera, Award, Terminal, Code2, CheckCheck, Compass, Activity } from 'lucide-react';
import type { AgentId, AgentInfo } from '../types/office.ts';

interface AgentInspectorModalProps {
  agent: AgentInfo | null;
  onClose: () => void;
  onFocusAgent: (agentId: AgentId) => void;
  onViewActivity?: (agentId: AgentId) => void;
}

export const AgentInspectorModal: React.FC<AgentInspectorModalProps> = ({
  agent,
  onClose,
  onFocusAgent,
  onViewActivity,
}) => {
  if (!agent) return null;

  const toolsByRole: Record<AgentId, string[]> = {
    planner: ['Product Spec Parser', 'Sprint Velocity Tracker', 'Dependency Graph', 'Acceptance Engine'],
    coder: ['TypeScript Compiler', 'Three.js Render Pipeline', 'Vite Bundler', 'AST Code Transformer'],
    reviewer: ['node:assert Suite', 'Playwright Accessibility Auditor', 'Memory Leak Profiler', 'Lint Guard'],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Banner with Agent Color */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg border-2"
              style={{ backgroundColor: `${agent.colorCss}20`, borderColor: agent.colorCss }}
            >
              {agent.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {agent.name}
                </h2>
                <span
                  className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full tracking-wider"
                  style={{ backgroundColor: `${agent.colorCss}25`, color: agent.colorCss }}
                >
                  Active
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {agent.role}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bio & Specialty */}
        <div className="space-y-3 mb-5">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {agent.bio}
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Core Specialty
            </span>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
              {agent.specialty}
            </p>
          </div>

          {/* Current State Card */}
          <div className="p-3 rounded-2xl border" style={{ borderColor: `${agent.colorCss}40`, backgroundColor: `${agent.colorCss}10` }}>
            <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: agent.colorCss }}>
              Current Status:
            </span>
            <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>💬</span>
              <span>"{agent.speechText}"</span>
            </p>
          </div>
        </div>

        {/* Workstation Tools */}
        <div className="mb-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Equipped Agent Tools
          </span>
          <div className="flex flex-wrap gap-1.5">
            {toolsByRole[agent.id].map((tool, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
          {onViewActivity ? (
            <button
              onClick={() => {
                onViewActivity(agent.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all active:scale-95"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Aktivitas & Task</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 font-medium">
              Desk: {agent.deskPos[0]}x, {agent.deskPos[2]}z
            </div>
          )}

          <button
            onClick={() => {
              onFocusAgent(agent.id);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 ml-auto"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Focus in 3D</span>
          </button>
        </div>
      </div>
    </div>
  );
};
