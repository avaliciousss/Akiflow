/**
 * Demo script showing how to use the ADHD Time-Blocking Copilot
 *
 * Run with: npx tsx examples/demo.ts
 */

import { TimeBlocker } from '../src/engine/time-blocker.js';
import { SessionManager } from '../src/engine/session-manager.js';
import { PlanningInput, Task, DerailmentRecovery } from '../src/types/index.js';

console.log('🧠 ADHD Time-Blocking Copilot - Demo\n');

// Initialize engines
const timeBlocker = new TimeBlocker();
const sessionManager = new SessionManager();

// Example 1: Generate a day plan
console.log('📅 Example 1: Generating a day plan\n');

const planningInput: PlanningInput = {
  available_start: new Date('2026-01-09T09:00:00').toISOString(),
  available_end: new Date('2026-01-09T17:00:00').toISOString(),
  tasks: [
    {
      title: 'Reply to urgent emails',
      description: 'Clear inbox and respond to high-priority messages',
      estimated_minutes: 20,
      priority: 'low',
      requires_energy: 'low',
    },
    {
      title: 'Write project proposal',
      description: 'Draft Q1 feature proposal for stakeholders',
      estimated_minutes: 45,
      priority: 'high',
      requires_energy: 'high',
    },
    {
      title: 'Review pull requests',
      description: 'Code review for team PRs',
      estimated_minutes: 30,
      priority: 'medium',
      requires_energy: 'medium',
    },
    {
      title: 'Update documentation',
      description: 'Add new API endpoints to docs',
      estimated_minutes: 25,
      priority: 'medium',
      requires_energy: 'medium',
    },
  ],
  energy_level: 'medium',
  preferences: {
    focus_duration_minutes: 25,
    break_duration_minutes: 5,
    buffer_percentage: 0.25,
    start_with_easy_task: true,
    theme_similar_tasks: false,
  },
};

const schedulePlan = timeBlocker.generatePlan(planningInput);

console.log(`Summary: ${schedulePlan.summary}\n`);
console.log(`Next Action: ${schedulePlan.next_action}\n`);
console.log('📋 Scheduled Blocks:\n');

schedulePlan.blocks.forEach((block, index) => {
  const startTime = new Date(block.start_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const endTime = new Date(block.end_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  console.log(`${index + 1}. [${block.type.toUpperCase()}] ${startTime} - ${endTime}`);
  console.log(`   ${block.title} (Energy: ${block.energy_level})`);
  console.log(`   Steps:`);
  block.steps.forEach(step => console.log(`   - ${step}`));
  console.log('');
});

// Example 2: Start a live session
console.log('\n⏱️  Example 2: Starting a live focus session\n');

const focusTask: Task = {
  title: 'Write technical blog post',
  description: 'Draft article about TypeScript best practices',
  estimated_minutes: 30,
  subtasks: [
    'Open editor and create new document',
    'Write outline with 3-5 main points',
    'Draft introduction paragraph',
    'Write first main section',
    'Light review and editing',
  ],
};

const session = sessionManager.startSession(focusTask, 30);

console.log(`Session ID: ${session.session_id}`);
console.log(`Task: ${session.task.title}`);
console.log(`Duration: ${session.planned_duration_minutes} minutes`);
console.log(`Status: ${session.status}\n`);
console.log('Next steps:');
session.steps.slice(0, 3).forEach((step, i) => {
  console.log(`${i + 1}. ${step}`);
});

// Example 3: Simulate a check-in
console.log('\n\n✅ Example 3: Recording a check-in\n');

const checkIn = sessionManager.recordCheckIn(session.session_id, {
  completed_work: 'Finished outline and introduction',
  energy_level: 'medium',
  continue_or_adjust: 'keep_going',
  notes: 'Feeling good, words are flowing',
});

console.log(`Check-in recorded at: ${new Date(checkIn.timestamp).toLocaleTimeString()}`);
console.log(`Energy: ${checkIn.energy_level}`);
console.log(`Decision: ${checkIn.continue_or_adjust}`);
console.log(`Completed: ${checkIn.completed_work}\n`);

const remainingSteps = sessionManager.getNextSteps(session.session_id);
console.log('Remaining steps:');
remainingSteps.forEach((step, i) => {
  console.log(`${i + 1}. ${step}`);
});

// Example 4: Handle derailment
console.log('\n\n🔄 Example 4: Creating a recovery plan after derailment\n');

const derailment: DerailmentRecovery = {
  current_time: new Date('2026-01-09T14:30:00').toISOString(),
  available_until: new Date('2026-01-09T17:00:00').toISOString(),
  what_happened: 'Got pulled into unexpected Slack conversations and lost 90 minutes',
  current_energy: 'low',
  remaining_tasks: [
    {
      title: 'Finish blog post',
      estimated_minutes: 20,
      priority: 'high',
    },
    {
      title: 'Update Jira tickets',
      estimated_minutes: 15,
      priority: 'low',
    },
  ],
};

const recovery = sessionManager.createRecoveryPlan(derailment);

console.log(`Acknowledgment: ${recovery.acknowledgment}\n`);
console.log(`Next Tiny Step: ${recovery.next_tiny_step}\n`);
console.log('Revised Schedule:');

recovery.revised_blocks.forEach((block, index) => {
  const startTime = new Date(block.start_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const endTime = new Date(block.end_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  console.log(`\n${index + 1}. ${block.title} (${startTime} - ${endTime})`);
  block.steps.forEach(step => console.log(`   - ${step}`));
});

if (recovery.reflection_question) {
  console.log(`\nReflection: ${recovery.reflection_question}`);
}

console.log('\n\n✨ Demo complete! The copilot is ready to help with ADHD-friendly time management.\n');
