import React from 'react';
import type { AgentId, AgentInfo } from '../types/office.ts';

interface SpeechBubblesProps {
  agents: Record<AgentId, AgentInfo>;
  coords: Record<AgentId, { x: number; y: number; visible: boolean }>;
  onAgentClick: (agentId: AgentId) => void;
}

export const SpeechBubbles: React.FC<SpeechBubblesProps> = ({ agents, coords, onAgentClick }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {(Object.keys(agents) as AgentId[]).map((id) => {
        const agent = agents[id];
        const coord = coords[id];

        if (!coord || !coord.visible || !agent.isSpeaking || !agent.speechText) {
          return null;
        }

        // Determine icon based on speech kind
        const kindIcon =
          agent.speechKind === 'talk'
            ? '💬'
            : agent.speechKind === 'done'
            ? '✅'
            : agent.speechKind === 'relax'
            ? '☕'
            : '⚙️';

        // Clamp to prevent horizontal overflow off screen edges on small devices
        const screenW = typeof window !== 'undefined' ? window.innerWidth : 800;
        const halfWidth = screenW < 640 ? 110 : 150;
        const clampedX = Math.max(halfWidth + 12, Math.min(screenW - halfWidth - 12, coord.x));
        const pointerOffset = Math.max(-80, Math.min(80, coord.x - clampedX));

        return (
          <div
            key={id}
            style={{
              left: `${clampedX}px`,
              top: `${coord.y}px`,
              transform: 'translate(-50%, -100%) translateY(-14px)',
              borderColor: agent.colorCss,
            }}
            className="absolute z-20 pointer-events-auto transition-all duration-150 ease-out cursor-pointer group"
            onClick={() => onAgentClick(id)}
            role="button"
            tabIndex={0}
            aria-label={`${agent.name} says: ${agent.speechText}`}
          >
            {/* Bubble Card */}
            <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl shadow-xl border-2 max-w-[220px] sm:max-w-[320px] transition-transform group-hover:scale-105"
                 style={{ borderColor: agent.colorCss }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs">{agent.icon}</span>
                <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: agent.colorCss }}>
                  {agent.name}
                </span>
                <span className="text-[10px] text-slate-400 ml-auto font-mono">
                  {agent.speechKind}
                </span>
              </div>
              <p className="text-[11px] sm:text-[13px] font-medium text-slate-800 dark:text-slate-100 leading-snug">
                <span className="mr-1">{kindIcon}</span>
                {agent.speechText}
              </p>

              {/* Triangle pointer pointing accurately toward character head */}
              <div
                className="absolute bottom-0 w-3 h-3 -mb-1.5 -ml-1.5 rotate-45 bg-white dark:bg-slate-900 border-r-2 border-b-2"
                style={{
                  left: `calc(50% + ${pointerOffset}px)`,
                  borderColor: agent.colorCss
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
