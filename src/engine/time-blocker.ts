import {
  TimeBlock,
  SchedulePlan,
  PlanningInput,
  Task,
  EnergyLevel,
  BlockType,
  PlanningPreferences,
} from '../types/index.js';

/**
 * Core time-blocking engine implementing ADHD-friendly scheduling principles
 */
export class TimeBlocker {
  private readonly DEFAULT_FOCUS_MINUTES = 25;
  private readonly DEFAULT_BREAK_MINUTES = 5;
  private readonly DEFAULT_BUFFER_PERCENTAGE = 0.25; // 25%
  private readonly EASY_START_MINUTES = 10;

  /**
   * Generate a complete schedule plan from user input
   */
  generatePlan(input: PlanningInput): SchedulePlan {
    const prefs = this.normalizePreferences(input.preferences);
    const availableMinutes = this.calculateAvailableMinutes(
      input.available_start,
      input.available_end
    );

    // Reserve buffer time
    const bufferMinutes = Math.floor(availableMinutes * prefs.buffer_percentage!);
    const schedulableMinutes = availableMinutes - bufferMinutes;

    // Prepare tasks
    let tasks = this.prepareTasks(input.tasks, input.energy_level);

    // Start with an easy, low-friction task (ADHD-friendly)
    if (prefs.start_with_easy_task) {
      tasks = this.prioritizeEasyStart(tasks);
    }

    // Generate blocks
    const blocks: TimeBlock[] = [];
    let currentTime = new Date(input.available_start);
    let remainingMinutes = schedulableMinutes;

    // Add hard commitments if any
    if (input.hard_commitments) {
      blocks.push(...input.hard_commitments);
    }

    // Create initial easy block
    if (tasks.length > 0) {
      const firstTask = tasks[0];
      const easyBlock = this.createFocusBlock(
        currentTime,
        Math.min(this.EASY_START_MINUTES, firstTask.estimated_minutes || this.EASY_START_MINUTES),
        firstTask,
        'Start small'
      );
      blocks.push(easyBlock);
      currentTime = new Date(easyBlock.end_time);
      remainingMinutes -= this.EASY_START_MINUTES;

      // If first task needs more time, continue with it
      const remainingTaskTime = (firstTask.estimated_minutes || this.DEFAULT_FOCUS_MINUTES) - this.EASY_START_MINUTES;
      if (remainingTaskTime > 0) {
        tasks[0] = { ...firstTask, estimated_minutes: remainingTaskTime };
      } else {
        tasks.shift(); // Remove completed task
      }
    }

    // Add break after easy start
    blocks.push(this.createBreakBlock(currentTime, prefs.break_duration_minutes!));
    currentTime = this.addMinutes(currentTime, prefs.break_duration_minutes!);
    remainingMinutes -= prefs.break_duration_minutes!;

    // Schedule remaining tasks with focus/break rhythm
    for (const task of tasks) {
      if (remainingMinutes <= 0) break;

      const focusDuration = Math.min(
        task.estimated_minutes || prefs.focus_duration_minutes!,
        remainingMinutes,
        prefs.focus_duration_minutes!
      );

      const focusBlock = this.createFocusBlock(currentTime, focusDuration, task);
      blocks.push(focusBlock);
      currentTime = new Date(focusBlock.end_time);
      remainingMinutes -= focusDuration;

      // Add break if there's enough time and more tasks
      if (remainingMinutes > prefs.break_duration_minutes! && tasks.indexOf(task) < tasks.length - 1) {
        blocks.push(this.createBreakBlock(currentTime, prefs.break_duration_minutes!));
        currentTime = this.addMinutes(currentTime, prefs.break_duration_minutes!);
        remainingMinutes -= prefs.break_duration_minutes!;
      }
    }

    // Add buffer block at the end
    if (bufferMinutes >= 10) {
      blocks.push(this.createBufferBlock(currentTime, bufferMinutes));
    }

    // Generate summary and next action
    const summary = this.generateSummary(blocks, input);
    const next_action = this.generateNextAction(blocks);

    return {
      summary,
      blocks: this.sortAndMergeBlocks(blocks),
      next_action,
    };
  }

  /**
   * Create a focus block for deep work
   */
  private createFocusBlock(
    startTime: Date,
    durationMinutes: number,
    task: Task,
    titlePrefix?: string
  ): TimeBlock {
    const endTime = this.addMinutes(startTime, durationMinutes);
    const steps = task.subtasks || this.breakTaskIntoMicroSteps(task);

    return {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      title: titlePrefix ? `${titlePrefix}: ${task.title}` : task.title,
      steps: steps.slice(0, 2), // Only show 1-2 steps
      energy_level: task.requires_energy || 'medium',
      type: 'focus',
    };
  }

  /**
   * Create a break block
   */
  private createBreakBlock(startTime: Date, durationMinutes: number): TimeBlock {
    const endTime = this.addMinutes(startTime, durationMinutes);

    return {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      title: 'Break + reset',
      steps: [
        'Stand up and stretch',
        'Drink water or have a snack',
        'Look away from screen (20-20-20 rule)',
      ],
      energy_level: 'low',
      type: 'break',
    };
  }

  /**
   * Create a buffer block for unexpected events
   */
  private createBufferBlock(startTime: Date, durationMinutes: number): TimeBlock {
    const endTime = this.addMinutes(startTime, durationMinutes);

    return {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      title: 'Buffer time',
      steps: [
        'Handle anything that ran over',
        'Quick admin or email catch-up',
        'Prep for tomorrow if extra time',
      ],
      energy_level: 'low',
      type: 'buffer',
    };
  }

  /**
   * Break a task into 1-2 micro-steps
   */
  private breakTaskIntoMicroSteps(task: Task): string[] {
    const steps: string[] = [];

    // Generic micro-steps based on task type
    if (task.description) {
      steps.push(`Open or locate: ${task.title}`);
      steps.push(`Review what needs to be done`);
      steps.push(`Start with the first small action`);
    } else {
      steps.push(`Begin: ${task.title}`);
      steps.push(`Focus on making initial progress`);
    }

    return steps;
  }

  /**
   * Normalize user preferences with defaults
   */
  private normalizePreferences(prefs?: PlanningPreferences): Required<PlanningPreferences> {
    return {
      focus_duration_minutes: prefs?.focus_duration_minutes || this.DEFAULT_FOCUS_MINUTES,
      break_duration_minutes: prefs?.break_duration_minutes || this.DEFAULT_BREAK_MINUTES,
      buffer_percentage: prefs?.buffer_percentage || this.DEFAULT_BUFFER_PERCENTAGE,
      start_with_easy_task: prefs?.start_with_easy_task ?? true,
      theme_similar_tasks: prefs?.theme_similar_tasks ?? false,
    };
  }

  /**
   * Calculate available minutes between start and end time
   */
  private calculateAvailableMinutes(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  }

  /**
   * Add minutes to a date
   */
  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
  }

  /**
   * Prepare and enrich tasks with defaults
   */
  private prepareTasks(tasks: Task[], defaultEnergy?: EnergyLevel): Task[] {
    return tasks.map((task) => ({
      ...task,
      estimated_minutes: task.estimated_minutes || this.DEFAULT_FOCUS_MINUTES,
      requires_energy: task.requires_energy || defaultEnergy || 'medium',
      priority: task.priority || 'medium',
    }));
  }

  /**
   * Prioritize an easy task first (ADHD-friendly)
   */
  private prioritizeEasyStart(tasks: Task[]): Task[] {
    if (tasks.length === 0) return tasks;

    // Find the task with shortest estimated time or lowest priority
    let easiestIndex = 0;
    let shortestTime = tasks[0].estimated_minutes || this.DEFAULT_FOCUS_MINUTES;

    for (let i = 1; i < tasks.length; i++) {
      const taskTime = tasks[i].estimated_minutes || this.DEFAULT_FOCUS_MINUTES;
      if (taskTime < shortestTime || tasks[i].priority === 'low') {
        easiestIndex = i;
        shortestTime = taskTime;
      }
    }

    // Move easiest task to front if it's not already there
    if (easiestIndex !== 0) {
      const easiestTask = tasks.splice(easiestIndex, 1)[0];
      tasks.unshift(easiestTask);
    }

    return tasks;
  }

  /**
   * Sort blocks by time and merge overlapping ones
   */
  private sortAndMergeBlocks(blocks: TimeBlock[]): TimeBlock[] {
    return blocks.sort((a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  }

  /**
   * Generate a summary of the plan
   */
  private generateSummary(blocks: TimeBlock[], input: PlanningInput): string {
    const focusBlocks = blocks.filter((b) => b.type === 'focus');
    const taskCount = focusBlocks.length;
    const startTime = new Date(input.available_start).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    const endTime = new Date(input.available_end).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    return `Your ${startTime}-${endTime} plan: ${taskCount} focus block${
      taskCount !== 1 ? 's' : ''
    } with built-in breaks and buffer time. Starting small to build momentum.`;
  }

  /**
   * Generate the immediate next action
   */
  private generateNextAction(blocks: TimeBlock[]): string {
    if (blocks.length === 0) {
      return 'No blocks scheduled. Take a breath and tell me what you need to work on.';
    }

    const firstBlock = blocks[0];
    const duration = this.calculateBlockDuration(firstBlock);

    return `Set a ${duration}-minute timer and start: ${firstBlock.title}`;
  }

  /**
   * Calculate block duration in minutes
   */
  private calculateBlockDuration(block: TimeBlock): number {
    const start = new Date(block.start_time);
    const end = new Date(block.end_time);
    return Math.round((end.getTime() - start.getTime()) / 60000);
  }
}
