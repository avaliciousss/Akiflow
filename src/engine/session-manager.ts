import {
  LiveSession,
  CheckIn,
  Task,
  DerailmentRecovery,
  RecoveryPlan,
  TimeBlock,
} from '../types/index.js';
import { TimeBlocker } from './time-blocker.js';

/**
 * Manages live focus sessions and handles derailment recovery
 */
export class SessionManager {
  private sessions: Map<string, LiveSession> = new Map();
  private timeBlocker: TimeBlocker;

  constructor() {
    this.timeBlocker = new TimeBlocker();
  }

  /**
   * Start a new live focus session
   */
  startSession(task: Task, durationMinutes: number): LiveSession {
    const sessionId = this.generateSessionId();
    const steps = task.subtasks || this.breakIntoMicroSteps(task);

    const session: LiveSession = {
      session_id: sessionId,
      task,
      planned_duration_minutes: durationMinutes,
      start_time: new Date().toISOString(),
      current_step: 0,
      steps,
      check_ins: [],
      status: 'active',
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Record a check-in during a session
   */
  recordCheckIn(sessionId: string, checkIn: Omit<CheckIn, 'timestamp'>): CheckIn {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const fullCheckIn: CheckIn = {
      ...checkIn,
      timestamp: new Date().toISOString(),
    };

    session.check_ins.push(fullCheckIn);

    // Adjust session based on check-in
    if (checkIn.continue_or_adjust === 'switch_task') {
      session.status = 'abandoned';
    } else if (checkIn.continue_or_adjust === 'shrink_plan') {
      // Could adjust remaining steps here
      session.current_step = Math.min(session.current_step + 1, session.steps.length - 1);
    }

    return fullCheckIn;
  }

  /**
   * Get the next step(s) for the user
   */
  getNextSteps(sessionId: string, count: number = 3): string[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    return session.steps.slice(session.current_step, session.current_step + count);
  }

  /**
   * Mark a step as complete and move to the next
   */
  completeStep(sessionId: string): { completed: string; next: string[] } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const completed = session.steps[session.current_step];
    session.current_step++;

    if (session.current_step >= session.steps.length) {
      session.status = 'completed';
    }

    return {
      completed,
      next: this.getNextSteps(sessionId),
    };
  }

  /**
   * End a session
   */
  endSession(sessionId: string, status: 'completed' | 'abandoned' = 'completed'): LiveSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = status;
    return session;
  }

  /**
   * Handle derailment and create a recovery plan
   */
  createRecoveryPlan(recovery: DerailmentRecovery): RecoveryPlan {
    // Warm, non-judgmental acknowledgment
    const acknowledgment = this.generateAcknowledgment(recovery.what_happened);

    // Calculate remaining time
    const remainingMinutes = this.calculateRemainingMinutes(
      recovery.current_time,
      recovery.available_until
    );

    // Generate a tiny next step
    const next_tiny_step = this.generateTinyStep(recovery);

    // Create revised, shorter blocks
    const revised_blocks = this.generateRecoveryBlocks(
      recovery,
      remainingMinutes
    );

    // Generate reflection question
    const reflection_question = this.generateReflectionQuestion(recovery.what_happened);

    return {
      acknowledgment,
      next_tiny_step,
      revised_blocks,
      reflection_question,
    };
  }

  /**
   * Generate a warm, non-judgmental acknowledgment
   */
  private generateAcknowledgment(whatHappened: string): string {
    const acknowledgments = [
      "That's completely normal with ADHD - plans often need adjusting, and that's okay.",
      "No problem at all. Time and focus can be tricky for everyone, especially with ADHD.",
      "Totally understandable. Let's not worry about what didn't happen and focus on what we can do now.",
      "This happens to everyone. The fact that you're coming back to it is what matters.",
    ];

    return acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
  }

  /**
   * Generate a tiny, low-friction next step
   */
  private generateTinyStep(recovery: DerailmentRecovery): string {
    const tinySteps = [
      "Take one deep breath, then open your task list.",
      "Start a 2-minute timer and just tidy your workspace.",
      "Write down the one thing you most want to get done in the next hour.",
      "Set a 10-minute timer for a single small task.",
    ];

    // Adjust based on energy level
    if (recovery.current_energy === 'low') {
      return "Take a 5-minute break to reset, then we'll plan something small.";
    }

    return tinySteps[Math.floor(Math.random() * tinySteps.length)];
  }

  /**
   * Generate recovery blocks - shorter and more realistic
   */
  private generateRecoveryBlocks(
    recovery: DerailmentRecovery,
    remainingMinutes: number
  ): TimeBlock[] {
    // Keep it super simple - just 1-2 blocks max
    const blocks: TimeBlock[] = [];
    const currentTime = new Date(recovery.current_time);

    // Adjust based on remaining time
    if (remainingMinutes < 15) {
      // Too short - just one micro block
      blocks.push({
        start_time: currentTime.toISOString(),
        end_time: this.addMinutes(currentTime, remainingMinutes).toISOString(),
        title: 'Quick win',
        steps: ['Pick one small task', 'Set a timer', 'Start'],
        energy_level: recovery.current_energy,
        type: 'focus',
      });
    } else if (remainingMinutes < 45) {
      // Short session - one focus block + break
      blocks.push({
        start_time: currentTime.toISOString(),
        end_time: this.addMinutes(currentTime, 20).toISOString(),
        title: 'Short focus block',
        steps: ['Choose one task', 'Work for 20 minutes', 'That\'s it'],
        energy_level: recovery.current_energy,
        type: 'focus',
      });

      blocks.push({
        start_time: this.addMinutes(currentTime, 20).toISOString(),
        end_time: this.addMinutes(currentTime, 25).toISOString(),
        title: 'Reset break',
        steps: ['Stand and stretch', 'Hydrate'],
        energy_level: 'low',
        type: 'break',
      });
    } else {
      // Use the time blocker for longer periods
      const tasks = recovery.remaining_tasks || [];
      if (tasks.length > 0) {
        const plan = this.timeBlocker.generatePlan({
          available_start: recovery.current_time,
          available_end: recovery.available_until,
          tasks: tasks.slice(0, 2), // Limit to 1-2 tasks
          energy_level: recovery.current_energy,
          preferences: {
            focus_duration_minutes: 25,
            break_duration_minutes: 5,
            buffer_percentage: 0.3, // More buffer for recovery
            start_with_easy_task: true,
          },
        });
        return plan.blocks;
      }
    }

    return blocks;
  }

  /**
   * Generate a simple reflection question
   */
  private generateReflectionQuestion(whatHappened: string): string {
    const questions = [
      "What's one small thing that could make the next block easier?",
      "Was the original plan too ambitious, or did something unexpected come up?",
      "What would help you stay on track for the next session?",
      "Is there a pattern you notice about when things get derailed?",
    ];

    return questions[Math.floor(Math.random() * questions.length)];
  }

  /**
   * Calculate remaining minutes
   */
  private calculateRemainingMinutes(current: string, until: string): number {
    const currentDate = new Date(current);
    const untilDate = new Date(until);
    return Math.floor((untilDate.getTime() - currentDate.getTime()) / 60000);
  }

  /**
   * Add minutes to a date
   */
  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
  }

  /**
   * Break task into micro-steps
   */
  private breakIntoMicroSteps(task: Task): string[] {
    return [
      `Take one breath, then open: ${task.title}`,
      'Review what needs to be done',
      'Start with the easiest part',
      'Make any progress, even tiny',
      'Check in on how it feels',
    ];
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): LiveSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): LiveSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.status === 'active');
  }
}
