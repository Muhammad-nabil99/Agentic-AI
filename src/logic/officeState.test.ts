import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNewTask,
  sortTasksByPriority,
  calculateWorkflowProgress,
  getWorkflowScriptForTask,
  PRESET_TASKS,
  INITIAL_AGENTS
} from './officeState.ts';

test('createNewTask generates properly formatted task object with default values', () => {
  const task = createNewTask('Test new feature');
  assert.equal(task.title, 'Test new feature');
  assert.equal(task.status, 'queued');
  assert.equal(task.priority, 'medium');
  assert.equal(task.progress, 0);
  assert.match(task.id, /^task-\d+$/);
});

test('createNewTask handles custom priority and description', () => {
  const task = createNewTask('Critical bug fix', 'critical', 'Urgent memory leak');
  assert.equal(task.title, 'Critical bug fix');
  assert.equal(task.priority, 'critical');
  assert.equal(task.description, 'Urgent memory leak');
});

test('sortTasksByPriority sorts critical > high > medium > low', () => {
  const tLow = createNewTask('Low priority item', 'low');
  const tMed = createNewTask('Med priority item', 'medium');
  const tHigh = createNewTask('High priority item', 'high');
  const tCrit = createNewTask('Critical priority item', 'critical');

  const sorted = sortTasksByPriority([tLow, tMed, tCrit, tHigh]);
  assert.equal(sorted[0].priority, 'critical');
  assert.equal(sorted[1].priority, 'high');
  assert.equal(sorted[2].priority, 'medium');
  assert.equal(sorted[3].priority, 'low');
});

test('calculateWorkflowProgress correctly scales stage progress into global percent', () => {
  assert.equal(calculateWorkflowProgress('queued', 0), 0);
  assert.equal(calculateWorkflowProgress('planning', 50), 20); // 5 + 0.5 * 30 = 20
  assert.equal(calculateWorkflowProgress('coding', 100), 75); // 35 + 1.0 * 40 = 75
  assert.equal(calculateWorkflowProgress('completed', 100), 100);
});

test('getWorkflowScriptForTask creates cohesive multi-agent sequence involving all 3 roles', () => {
  const sampleTask = createNewTask('Demo feature', 'high');
  const script = getWorkflowScriptForTask(sampleTask);

  assert.ok(script.length >= 10, 'Workflow script must have substantial depth');
  const actors = new Set(script.map(s => s.actor));
  assert.ok(actors.has('planner'), 'Planner must be an actor');
  assert.ok(actors.has('coder'), 'Coder must be an actor');
  assert.ok(actors.has('reviewer'), 'Reviewer must be an actor');

  const finalStep = script[script.length - 1];
  assert.equal(finalStep.taskStatus, 'completed');
  assert.equal(finalStep.progressIncrement, 100);
});

test('PRESET_TASKS contains diverse real-world engineering tasks', () => {
  assert.ok(PRESET_TASKS.length >= 5);
  const titles = PRESET_TASKS.map(t => t.title);
  assert.ok(titles.some(t => t.includes('OAuth')));
  assert.ok(titles.some(t => t.includes('Three.js')));
});

test('INITIAL_AGENTS contains three distinct team members with unique stations and styles', () => {
  assert.ok(INITIAL_AGENTS.planner);
  assert.ok(INITIAL_AGENTS.coder);
  assert.ok(INITIAL_AGENTS.reviewer);

  assert.notEqual(INITIAL_AGENTS.planner.deskPos[0], INITIAL_AGENTS.coder.deskPos[0]);
  assert.notEqual(INITIAL_AGENTS.coder.deskPos[0], INITIAL_AGENTS.reviewer.deskPos[0]);
  assert.notEqual(INITIAL_AGENTS.planner.colorHex, INITIAL_AGENTS.coder.colorHex);
});
