import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { AgentId, AgentInfo, CameraView, LightingTheme, Task, TaskPriority, ActivityLog, TaskStatus, WindowConfig } from './types/office.ts';
import {
  INITIAL_AGENTS,
  PRESET_TASKS,
  createNewTask,
  getWorkflowScriptForTask,
  sortTasksByPriority,
  WorkflowStep,
} from './logic/officeState.ts';
import { soundManager } from './utils/audio.ts';
import { ThreeCanvas } from './components/ThreeCanvas.tsx';
import { SpeechBubbles } from './components/SpeechBubbles.tsx';
import { Header } from './components/Header.tsx';
import { ControlDock } from './components/ControlDock.tsx';
import { NewTaskModal } from './components/NewTaskModal.tsx';
import { AgentInspectorModal } from './components/AgentInspectorModal.tsx';
import { ActivityLogDrawer } from './components/ActivityLogDrawer.tsx';

export default function App() {
  // State
  const [agents, setAgents] = useState<Record<AgentId, AgentInfo>>({ ...INITIAL_AGENTS });
  const [taskQueue, setTaskQueue] = useState<Task[]>(() => {
    return [
      createNewTask(PRESET_TASKS[0].title, PRESET_TASKS[0].priority, PRESET_TASKS[0].description),
      createNewTask(PRESET_TASKS[1].title, PRESET_TASKS[1].priority, PRESET_TASKS[1].description),
      createNewTask(PRESET_TASKS[2].title, PRESET_TASKS[2].priority, PRESET_TASKS[2].description),
    ];
  });
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [completedTasksCount, setCompletedTasksCount] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => [
    {
      id: 'log-init',
      timestamp: Date.now(),
      type: 'task_created',
      title: '🏢 Agentic Office online',
      detail: 'Autonomous team initialized: Planner 🗂️, Coder 💻, Reviewer 🔍.',
      agentId: 'planner',
    },
  ]);

  // Simulation controls
  const [speed, setSpeed] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [theme, setTheme] = useState<LightingTheme>('daylight');
  const [cameraView, setCameraView] = useState<CameraView>('overview');

  // Adjustable Panoramic Window & Skyline configuration
  const [windowConfig, setWindowConfig] = useState<WindowConfig>({
    glassOpacity: 0.35,
    skylineDepth: 1.0,
    windowGlow: 1.0,
    glassTint: 'auto',
  });

  // Synchronize document dark class with lighting theme (morning/daylight, sunset, night, cyberpunk)
  useEffect(() => {
    if (theme === 'night' || theme === 'cyberpunk') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);


  // Overlays & Modals
  const [inspectedAgentId, setInspectedAgentId] = useState<AgentId | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState<boolean>(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState<boolean>(false);
  const [activityAgentFilter, setActivityAgentFilter] = useState<AgentId | null>(null);

  // 2D Screen Projection coordinates for speech bubbles
  const [screenCoords, setScreenCoords] = useState<Record<AgentId, { x: number; y: number; visible: boolean }>>({
    planner: { x: 0, y: 0, visible: false },
    coder: { x: 0, y: 0, visible: false },
    reviewer: { x: 0, y: 0, visible: false },
  });

  // Current active workflow execution refs
  const currentStepIndexRef = useRef<number>(0);
  const activeScriptRef = useRef<WorkflowStep[] | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isExecutingRef = useRef<boolean>(false);

  const speedRef = useRef(speed);
  speedRef.current = speed;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const logActivity = useCallback(
    (
      type: ActivityLog['type'],
      title: string,
      detail?: string,
      agentId?: AgentId,
      targetAgentId?: AgentId,
      taskId?: string,
      taskTitle?: string
    ) => {
      const newLog: ActivityLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        type,
        title,
        detail,
        agentId,
        targetAgentId,
        taskId,
        taskTitle,
      };
      setActivityLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    },
    []
  );

  // Update speech & state of an agent
  const updateAgentState = useCallback((agentId: AgentId, updates: Partial<AgentInfo>) => {
    setAgents((prev) => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        ...updates,
      },
    }));
  }, []);

  // Execute single step in active task workflow
  const executeStep = useCallback((stepIndex: number, script: WorkflowStep[], task: Task) => {
    if (stepIndex >= script.length) {
      // Task is finished
      const finishedTask: Task = {
        ...task,
        status: 'completed',
        progress: 100,
        completedAt: Date.now(),
      };
      setCompletedTasks((prev) => [finishedTask, ...prev]);
      setActiveTask(null);
      setCompletedTasksCount((c) => c + 1);

      soundManager.playCelebrationChime();
      logActivity(
        'task_completed',
        `🎉 Sprint completed: ${task.title}`,
        'Sprint verified by Reviewer and merged to main.',
        'reviewer',
        'planner',
        task.id,
        task.title
      );

      // Reset all agents to idle state and update individual stats
      setAgents((prev) => ({
        planner: {
          ...prev.planner,
          speechKind: 'idle',
          speechText: 'Ready for next sprint!',
          currentAction: 'Idle at desk',
          isSpeaking: true,
          tasksCompleted: prev.planner.tasksCompleted + 1,
        },
        coder: {
          ...prev.coder,
          speechKind: 'idle',
          speechText: 'Ready for next task ☕',
          currentAction: 'Idle at desk',
          isSpeaking: true,
          tasksCompleted: prev.coder.tasksCompleted + 1,
          linesOfCode: prev.coder.linesOfCode + Math.floor(Math.random() * 80 + 120),
        },
        reviewer: {
          ...prev.reviewer,
          speechKind: 'idle',
          speechText: 'Standards remain high today.',
          currentAction: 'Idle at desk',
          isSpeaking: true,
          tasksCompleted: prev.reviewer.tasksCompleted + 1,
          reviewsCompleted: prev.reviewer.reviewsCompleted + 1,
        },
      }));

      isExecutingRef.current = false;
      return;
    }

    const step = script[stepIndex];
    currentStepIndexRef.current = stepIndex;

    // Update active task progress
    setActiveTask((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: step.taskStatus,
        progress: step.progressIncrement,
      };
    });

    // Update actor speech & action
    updateAgentState(step.actor, {
      speechText: step.speech,
      speechKind:
        step.action === 'talk'
          ? 'talk'
          : step.action === 'done'
          ? 'done'
          : step.speech.includes('☕')
          ? 'relax'
          : 'work',
      currentAction: step.logTitle,
      isSpeaking: true,
    });

    // Play synthesized sound effects
    if (step.action === 'talk') {
      const pitch = step.actor === 'planner' ? 120 : step.actor === 'coder' ? 0 : -80;
      soundManager.playDialogueBlip(pitch);
    } else if (step.action === 'walk_to') {
      soundManager.playHandoffSound();
    } else if (step.action === 'done') {
      soundManager.playCelebrationChime();
    }

    logActivity(
      step.action === 'talk' || step.action === 'walk_to'
        ? 'handoff'
        : step.taskStatus === 'planning'
        ? 'planning'
        : step.taskStatus === 'coding'
        ? 'coding'
        : step.taskStatus === 'reviewing'
        ? 'review'
        : 'handoff',
      step.logTitle,
      step.logDetail,
      step.actor,
      step.target,
      task.id,
      task.title
    );

    // Schedule next step respecting simulation speed and pause
    const runNext = () => {
      if (isPausedRef.current) {
        stepTimerRef.current = setTimeout(runNext, 200);
        return;
      }
      const adjustedDuration = Math.max(300, step.durationMs / (speedRef.current || 1));
      stepTimerRef.current = setTimeout(() => {
        executeStep(stepIndex + 1, script, task);
      }, adjustedDuration);
    };

    runNext();
  }, [logActivity, updateAgentState]);

  // Main task loop
  useEffect(() => {
    if (isExecutingRef.current || isPaused) return;

    if (!activeTask) {
      if (taskQueue.length > 0) {
        // Pop next task from queue
        const nextTask = taskQueue[0];
        setTaskQueue((prev) => prev.slice(1));
        setActiveTask(nextTask);

        logActivity(
          'task_created',
          `🗂️ Starting task: ${nextTask.title}`,
          `Priority: ${nextTask.priority.toUpperCase()} - Handed to Planner for decomposition.`,
          'planner',
          undefined,
          nextTask.id,
          nextTask.title
        );

        const script = getWorkflowScriptForTask(nextTask);
        activeScriptRef.current = script;
        isExecutingRef.current = true;
        currentStepIndexRef.current = 0;

        executeStep(0, script, nextTask);
      } else {
        // Auto-seed next realistic task to keep simulation alive
        const randomPreset = PRESET_TASKS[Math.floor(Math.random() * PRESET_TASKS.length)];
        const autoTask = createNewTask(randomPreset.title, randomPreset.priority, randomPreset.description);
        setTaskQueue([autoTask]);
      }
    }
  }, [activeTask, taskQueue, isPaused, executeStep, logActivity]);

  // Handle User Actions
  const handleAddNewTask = (title: string, priority: TaskPriority, description: string) => {
    const newTask = createNewTask(title, priority, description);
    setTaskQueue((prev) => sortTasksByPriority([...prev, newTask]));
    logActivity(
      'task_created',
      `➕ Task queued: ${newTask.title}`,
      `Priority: ${priority.toUpperCase()}`,
      'planner',
      undefined,
      newTask.id,
      newTask.title
    );
    soundManager.playDialogueBlip(60);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setEnabled(next);
  };

  const handleTogglePlay = () => {
    setIsPaused((p) => !p);
  };

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden transition-colors duration-500 ${
        theme === 'cyberpunk'
          ? 'bg-slate-950 text-slate-100'
          : theme === 'night'
          ? 'bg-slate-950 text-slate-100'
          : theme === 'sunset'
          ? 'bg-amber-50 text-slate-900'
          : 'bg-blue-50 text-slate-900'
      }`}
    >
      {/* 3D Three.js Canvas Scene Viewport */}
      <ThreeCanvas
        agents={agents}
        activeTask={activeTask}
        cameraView={cameraView}
        theme={theme}
        windowConfig={windowConfig}
        speed={speed}
        isPaused={isPaused}
        onAgentClick={(id) => setInspectedAgentId(id)}
        onUpdateScreenCoords={(coords) => setScreenCoords(coords)}
      />

      {/* Floating 2D Speech Bubbles anchored to 3D heads */}
      <SpeechBubbles
        agents={agents}
        coords={screenCoords}
        onAgentClick={(id) => setInspectedAgentId(id)}
      />

      {/* Top Header Bar */}
      <Header
        activeTask={activeTask}
        tasksCompletedCount={completedTasksCount}
        queueCount={taskQueue.length}
        activeAgentId={activeScriptRef.current ? activeScriptRef.current[currentStepIndexRef.current]?.actor ?? null : null}
        agents={agents}
        theme={theme}
        onChangeTheme={(th) => setTheme(th)}
        onOpenNewTask={() => setIsNewTaskModalOpen(true)}
        onOpenFeed={() => setIsActivityLogOpen(true)}
        onSelectAgent={(id) => {
          setCameraView(id);
          setInspectedAgentId(id);
        }}
      />

      {/* Bottom Center Collapsible Controls Dock */}
      <ControlDock
        speed={speed}
        isPaused={isPaused}
        soundEnabled={soundEnabled}
        theme={theme}
        cameraView={cameraView}
        windowConfig={windowConfig}
        onChangeWindowConfig={setWindowConfig}
        onTogglePlay={handleTogglePlay}
        onChangeSpeed={(s) => setSpeed(s)}
        onToggleSound={handleToggleSound}
        onChangeTheme={(th) => setTheme(th)}
        onChangeCamera={(cam) => setCameraView(cam)}
        onOpenNewTask={() => setIsNewTaskModalOpen(true)}
        onOpenFeed={() => setIsActivityLogOpen(true)}
      />


      {/* Modal: Add New Task */}
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onAddTask={handleAddNewTask}
      />

      {/* Modal: Inspect Agent Profile */}
      <AgentInspectorModal
        agent={inspectedAgentId ? agents[inspectedAgentId] : null}
        onClose={() => setInspectedAgentId(null)}
        onFocusAgent={(id) => setCameraView(id)}
        onViewActivity={(agentId) => {
          setActivityAgentFilter(agentId);
          setIsActivityLogOpen(true);
        }}
      />

      {/* Drawer: Real-time Activity Logs */}
      <ActivityLogDrawer
        isOpen={isActivityLogOpen}
        logs={activityLogs}
        agents={agents}
        activeTask={activeTask}
        taskQueue={taskQueue}
        completedTasks={completedTasks}
        initialAgentFilter={activityAgentFilter}
        theme={theme}
        onChangeTheme={(th) => setTheme(th)}
        onClose={() => {
          setIsActivityLogOpen(false);
          setActivityAgentFilter(null);
        }}
        onClearLogs={() => setActivityLogs([])}
        onFocusAgent={(id) => setCameraView(id)}
      />
    </div>
  );
}
