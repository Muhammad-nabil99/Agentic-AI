import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { AgentId, AgentInfo, CameraView, LightingTheme, Task, TaskPriority, ActivityLog, TaskStatus } from './types/office.ts';
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
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => [
    {
      id: 'log-init',
      timestamp: Date.now(),
      type: 'task_created',
      title: '🏢 Agentic Office online',
      detail: 'Autonomous team initialized: Planner 🗂️, Coder 💻, Reviewer 🔍.',
    },
  ]);

  // Simulation controls
  const [speed, setSpeed] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [theme, setTheme] = useState<LightingTheme>('daylight');
  const [cameraView, setCameraView] = useState<CameraView>('overview');

  // Overlays & Modals
  const [inspectedAgentId, setInspectedAgentId] = useState<AgentId | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState<boolean>(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState<boolean>(false);

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

  const logActivity = useCallback((type: ActivityLog['type'], title: string, detail?: string, agentId?: AgentId) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      type,
      title,
      detail,
      agentId,
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  }, []);

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
      task.status = 'completed';
      task.progress = 100;
      task.completedAt = Date.now();
      setActiveTask(null);
      setCompletedTasksCount((c) => c + 1);

      soundManager.playCelebrationChime();
      logActivity(
        'task_completed',
        `🎉 Sprint completed: ${task.title}`,
        'Sprint verified by Reviewer and merged to main.',
        'planner'
      );

      // Reset all agents to idle state
      (['planner', 'coder', 'reviewer'] as AgentId[]).forEach((aid) => {
        updateAgentState(aid, {
          speechKind: 'idle',
          speechText: aid === 'coder' ? 'Ready for next task ☕' : 'Ready!',
          currentAction: 'Idle at desk',
          isSpeaking: true,
        });
      });

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
      step.taskStatus === 'planning'
        ? 'planning'
        : step.taskStatus === 'coding'
        ? 'coding'
        : step.taskStatus === 'reviewing'
        ? 'review'
        : 'handoff',
      step.logTitle,
      step.logDetail,
      step.actor
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
          `Priority: ${nextTask.priority.toUpperCase()} - Handed to Planner for decomposition.`
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
    logActivity('task_created', `➕ Task queued: ${newTask.title}`, `Priority: ${priority.toUpperCase()}`);
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
      className={`relative w-screen h-screen overflow-hidden ${
        theme === 'cyberpunk'
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
      />

      {/* Drawer: Real-time Activity Logs */}
      <ActivityLogDrawer
        isOpen={isActivityLogOpen}
        logs={activityLogs}
        onClose={() => setIsActivityLogOpen(false)}
        onClearLogs={() => setActivityLogs([])}
      />
    </div>
  );
}
