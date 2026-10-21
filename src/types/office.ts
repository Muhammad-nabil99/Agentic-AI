export type AgentId = 'planner' | 'coder' | 'reviewer';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'queued' | 'planning' | 'coding' | 'reviewing' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number; // 0 to 100
  createdAt: number;
  completedAt?: number;
  stageTimings?: {
    planning: number;
    coding: number;
    reviewing: number;
  };
}

export type AgentStateKind = 'idle' | 'work' | 'talk' | 'walk' | 'done' | 'relax';

export interface AgentInfo {
  id: AgentId;
  name: string;
  icon: string;
  role: string;
  specialty: string;
  bio: string;
  colorHex: number;
  colorCss: string;
  deskPos: [number, number, number];
  seatPos: [number, number, number];
  currentAction: string;
  speechText: string;
  speechKind: AgentStateKind;
  isSpeaking: boolean;
  tasksCompleted: number;
  linesOfCode: number;
  reviewsCompleted: number;
}

export type ActivityType = 'task_created' | 'planning' | 'handoff' | 'coding' | 'review' | 'task_completed';

export interface ActivityLog {
  id: string;
  timestamp: number;
  agentId?: AgentId;
  targetAgentId?: AgentId;
  type: ActivityType;
  title: string;
  detail?: string;
  taskId?: string;
  taskTitle?: string;
}

export type CameraView = 'overview' | 'planner' | 'coder' | 'reviewer' | 'cinematic';

export type LightingTheme = 'daylight' | 'sunset' | 'cyberpunk';

export interface OfficeSimConfig {
  speed: number;
  isPaused: boolean;
  soundEnabled: boolean;
  theme: LightingTheme;
  cameraView: CameraView;
}
