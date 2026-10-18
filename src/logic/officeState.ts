import type { AgentId, AgentInfo, Task, TaskPriority, TaskStatus, ActivityLog } from '../types/office.ts';

export const PRESET_TASKS: Array<{ title: string; priority: TaskPriority; description: string }> = [
  {
    title: 'Implement OAuth 2.0 Auth Flow',
    priority: 'high',
    description: 'Add secure token exchange, refresh tokens, and encrypted session cookies.'
  },
  {
    title: 'Migrate to Three.js PBR Shaders',
    priority: 'medium',
    description: 'Upgrade materials to MeshPhysicalMaterial with procedural studio reflections.'
  },
  {
    title: 'Optimize API Response Latency',
    priority: 'high',
    description: 'Add Redis cache layer for high-throughput user profile queries.'
  },
  {
    title: 'Automated CI/CD Test Pipeline',
    priority: 'medium',
    description: 'Configure node:test and Playwright headless runs on each pull request.'
  },
  {
    title: 'Fix Memory Leak in Render Loop',
    priority: 'critical',
    description: 'Properly dispose unused Three.js BufferGeometry and WebGLRenderTarget objects.'
  },
  {
    title: 'Design Mobile Collapsible Dock',
    priority: 'low',
    description: 'Ensure touch targets meet 44px minimum and HUD avoids viewport occlusion.'
  },
  {
    title: 'Implement Dark & Cyberpunk Themes',
    priority: 'low',
    description: 'Provide dynamic ambient lighting adjustments and neon color palettes.'
  },
  {
    title: 'Add Real-time Web Audio Synthesizer',
    priority: 'medium',
    description: 'Create zero-dependency acoustic typing sounds and dialogue bleeps.'
  }
];

export const INITIAL_AGENTS: Record<AgentId, AgentInfo> = {
  planner: {
    id: 'planner',
    name: 'Planner',
    icon: '🗂️',
    role: 'Product & Architecture Lead',
    specialty: 'Requirement analysis, scope decomposition, and milestone coordination',
    bio: 'Breaks complex client specifications into actionable engineering sprints with strict acceptance criteria.',
    colorHex: 0xff6b8b,
    colorCss: '#ff6b8b',
    deskPos: [-4.6, 0, -3.2],
    seatPos: [-4.6, 0, -2.05],
    currentAction: 'Planning sprint roadmap',
    speechText: 'Ready for new challenges!',
    speechKind: 'idle',
    isSpeaking: true,
    tasksCompleted: 0,
    linesOfCode: 0,
    reviewsCompleted: 0
  },
  coder: {
    id: 'coder',
    name: 'Coder',
    icon: '💻',
    role: 'Full-Stack Software Engineer',
    specialty: 'TypeScript, Three.js, React component architecture, and algorithmic logic',
    bio: 'Transforms specifications into high-performance, modular, and type-safe codebases.',
    colorHex: 0x4da3ff,
    colorCss: '#4da3ff',
    deskPos: [0, 0, -3.6],
    seatPos: [0, 0, -2.45],
    currentAction: 'Ready to write code',
    speechText: 'Coffee brewed, ready to build!',
    speechKind: 'idle',
    isSpeaking: true,
    tasksCompleted: 0,
    linesOfCode: 0,
    reviewsCompleted: 0
  },
  reviewer: {
    id: 'reviewer',
    name: 'Reviewer',
    icon: '🔍',
    role: 'QA & Security Auditor',
    specialty: 'Edge-case verification, performance profiling, and accessibility audits',
    bio: 'Scrutinizes pull requests for regressions, memory safety, and visual polish before deployment.',
    colorHex: 0x38d996,
    colorCss: '#38d996',
    deskPos: [4.6, 0, -3.2],
    seatPos: [4.6, 0, -2.05],
    currentAction: 'Monitoring code quality',
    speechText: 'Standards remain high today.',
    speechKind: 'idle',
    isSpeaking: true,
    tasksCompleted: 0,
    linesOfCode: 0,
    reviewsCompleted: 0
  }
};

let taskIdCounter = 100;

export function createNewTask(title: string, priority: TaskPriority = 'medium', description: string = ''): Task {
  taskIdCounter += 1;
  return {
    id: `task-${taskIdCounter}`,
    title: title.trim() || `Sprint Task #${taskIdCounter}`,
    description: description.trim() || 'Automated feature implementation task.',
    priority,
    status: 'queued',
    progress: 0,
    createdAt: Date.now()
  };
}

export function sortTasksByPriority(tasks: Task[]): Task[] {
  const priorityWeight: Record<TaskPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  };
  return [...tasks].sort((a, b) => {
    const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (diff !== 0) return diff;
    return a.createdAt - b.createdAt;
  });
}

export function calculateWorkflowProgress(status: TaskStatus, stageProgress: number): number {
  const stageWeights: Record<TaskStatus, { base: number; span: number }> = {
    queued: { base: 0, span: 5 },
    planning: { base: 5, span: 30 },
    coding: { base: 35, span: 40 },
    reviewing: { base: 75, span: 25 },
    completed: { base: 100, span: 0 }
  };
  const { base, span } = stageWeights[status] || { base: 0, span: 0 };
  const clampedStageProgress = Math.max(0, Math.min(100, stageProgress));
  return Math.min(100, Math.round(base + (span * clampedStageProgress) / 100));
}

export interface WorkflowStep {
  actor: AgentId;
  target?: AgentId;
  action: 'idle' | 'walk_to' | 'walk_home' | 'talk' | 'work' | 'done';
  speech: string;
  durationMs: number;
  logTitle: string;
  logDetail: string;
  taskStatus: TaskStatus;
  progressIncrement: number;
}

export function getWorkflowScriptForTask(task: Task): WorkflowStep[] {
  return [
    {
      actor: 'planner',
      action: 'work',
      speech: `Analyzing specs: "${task.title}"`,
      durationMs: 2200,
      logTitle: `🗂️ Planner started: ${task.title}`,
      logDetail: `Priority: ${task.priority.toUpperCase()}. Reviewing constraints and user story.`,
      taskStatus: 'planning',
      progressIncrement: 15
    },
    {
      actor: 'planner',
      action: 'work',
      speech: 'Drafting architecture & acceptance tests...',
      durationMs: 2000,
      logTitle: '🗂️ Requirements broken into sprint tasks',
      logDetail: 'Created component interfaces and acceptance test scenarios.',
      taskStatus: 'planning',
      progressIncrement: 30
    },
    {
      actor: 'planner',
      target: 'coder',
      action: 'walk_to',
      speech: 'Walking over to Coder...',
      durationMs: 1400,
      logTitle: '🗂️ Planner delegating to Coder',
      logDetail: 'Carrying technical specification to engineering desk.',
      taskStatus: 'planning',
      progressIncrement: 35
    },
    {
      actor: 'planner',
      target: 'coder',
      action: 'talk',
      speech: `Hey Coder! Can you implement: "${task.title}"?`,
      durationMs: 2200,
      logTitle: '💬 Planner -> Coder: Sprint brief passed',
      logDetail: 'Explained data flow, interfaces, and expected edge cases.',
      taskStatus: 'coding',
      progressIncrement: 40
    },
    {
      actor: 'coder',
      target: 'planner',
      action: 'talk',
      speech: 'Specs look crisp! Commencing development right now.',
      durationMs: 1800,
      logTitle: '💬 Coder accepted task',
      logDetail: 'Initializing feature branch and scaffold files.',
      taskStatus: 'coding',
      progressIncrement: 45
    },
    {
      actor: 'planner',
      action: 'walk_home',
      speech: 'Back to board. Monitoring sprint...',
      durationMs: 1400,
      logTitle: '🗂️ Planner returned to desk',
      logDetail: 'Updated Kanban board to In-Development.',
      taskStatus: 'coding',
      progressIncrement: 50
    },
    {
      actor: 'coder',
      action: 'work',
      speech: 'Writing clean modular TypeScript components...',
      durationMs: 2800,
      logTitle: '💻 Coder writing implementation',
      logDetail: 'Implementing hooks, business logic, and UI bindings.',
      taskStatus: 'coding',
      progressIncrement: 65
    },
    {
      actor: 'coder',
      action: 'work',
      speech: 'Adding tests with node:assert and linting...',
      durationMs: 2400,
      logTitle: '💻 Coder running automated checks',
      logDetail: 'Running linter, static typecheck, and unit test suites.',
      taskStatus: 'coding',
      progressIncrement: 75
    },
    {
      actor: 'coder',
      target: 'reviewer',
      action: 'walk_to',
      speech: 'Taking PR over to Reviewer...',
      durationMs: 1400,
      logTitle: '💻 Coder opened Pull Request',
      logDetail: 'Branch ready for review: +248 / -32 lines.',
      taskStatus: 'reviewing',
      progressIncrement: 80
    },
    {
      actor: 'coder',
      target: 'reviewer',
      action: 'talk',
      speech: `PR is ready! Please review "${task.title}".`,
      durationMs: 2000,
      logTitle: '💬 Coder -> Reviewer: Requested code review',
      logDetail: 'Requested security, performance, and responsive layout audit.',
      taskStatus: 'reviewing',
      progressIncrement: 83
    },
    {
      actor: 'reviewer',
      target: 'coder',
      action: 'talk',
      speech: 'Opening diff. Checking memory limits & types...',
      durationMs: 1800,
      logTitle: '💬 Reviewer started inspection',
      logDetail: 'Validating against architecture guidelines and test coverage.',
      taskStatus: 'reviewing',
      progressIncrement: 86
    },
    {
      actor: 'coder',
      action: 'walk_home',
      speech: 'Grabbing a fresh brew while tests run... ☕',
      durationMs: 1400,
      logTitle: '💻 Coder resting at desk',
      logDetail: 'Taking a healthy micro-break.',
      taskStatus: 'reviewing',
      progressIncrement: 88
    },
    {
      actor: 'reviewer',
      action: 'work',
      speech: 'Auditing bundle size and edge cases...',
      durationMs: 2600,
      logTitle: '🔍 Reviewer running static analysis',
      logDetail: 'Checked accessibility labels, zero-404 assets, and cleanup handlers.',
      taskStatus: 'reviewing',
      progressIncrement: 93
    },
    {
      actor: 'reviewer',
      target: 'planner',
      action: 'walk_to',
      speech: 'Heading to Planner to deliver sign-off...',
      durationMs: 1400,
      logTitle: '🔍 Reviewer approved PR',
      logDetail: 'All tests green, zero warnings, production ready!',
      taskStatus: 'reviewing',
      progressIncrement: 96
    },
    {
      actor: 'reviewer',
      target: 'planner',
      action: 'done',
      speech: 'PR approved with flying colors! Ready to deploy. 🚀',
      durationMs: 2000,
      logTitle: '✅ Reviewer confirmed delivery to Planner',
      logDetail: 'Sprint goals satisfied with high quality score.',
      taskStatus: 'completed',
      progressIncrement: 98
    },
    {
      actor: 'planner',
      target: 'reviewer',
      action: 'done',
      speech: 'Fantastic work team! Shipped to production. 🎉',
      durationMs: 2000,
      logTitle: `🎉 Task completed: ${task.title}`,
      logDetail: 'Deployed to production. Team metrics updated.',
      taskStatus: 'completed',
      progressIncrement: 100
    },
    {
      actor: 'reviewer',
      action: 'walk_home',
      speech: 'Back to review station.',
      durationMs: 1400,
      logTitle: '🔍 Reviewer returned to desk',
      logDetail: 'Ready for upcoming pull requests.',
      taskStatus: 'completed',
      progressIncrement: 100
    }
  ];
}
