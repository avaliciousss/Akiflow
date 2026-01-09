/**
 * Energy levels for blocks and user state
 */
export type EnergyLevel = 'low' | 'medium' | 'high';

/**
 * Types of time blocks
 */
export type BlockType = 'focus' | 'break' | 'admin' | 'buffer' | 'transition' | 'reflection';

/**
 * A single time block in the schedule
 */
export interface TimeBlock {
  start_time: string; // ISO 8601 datetime string
  end_time: string;   // ISO 8601 datetime string
  title: string;
  steps: string[];
  energy_level: EnergyLevel;
  type: BlockType;
}

/**
 * Complete schedule plan response
 */
export interface SchedulePlan {
  summary: string;
  blocks: TimeBlock[];
  next_action: string;
}

/**
 * User's planning constraints and preferences
 */
export interface PlanningInput {
  available_start: string; // ISO 8601 datetime
  available_end: string;   // ISO 8601 datetime
  hard_commitments?: TimeBlock[];
  tasks: Task[];
  energy_level?: EnergyLevel;
  preferences?: PlanningPreferences;
}

/**
 * A task to be scheduled
 */
export interface Task {
  id?: string;
  title: string;
  description?: string;
  estimated_minutes?: number;
  priority?: 'low' | 'medium' | 'high';
  deadline?: string; // ISO 8601 datetime
  requires_energy?: EnergyLevel;
  subtasks?: string[];
}

/**
 * User preferences for planning
 */
export interface PlanningPreferences {
  focus_duration_minutes?: number; // Default: 25-50
  break_duration_minutes?: number; // Default: 5-10
  buffer_percentage?: number;      // Default: 20-30%
  start_with_easy_task?: boolean;  // Default: true
  theme_similar_tasks?: boolean;   // Default: true
}

/**
 * Live session state
 */
export interface LiveSession {
  session_id: string;
  task: Task;
  planned_duration_minutes: number;
  start_time: string;
  current_step: number;
  steps: string[];
  check_ins: CheckIn[];
  status: 'active' | 'paused' | 'completed' | 'abandoned';
}

/**
 * Check-in during a live session
 */
export interface CheckIn {
  timestamp: string;
  completed_work: string;
  energy_level: EnergyLevel;
  continue_or_adjust: 'keep_going' | 'shrink_plan' | 'switch_task';
  notes?: string;
}

/**
 * Derailment recovery request
 */
export interface DerailmentRecovery {
  current_time: string;
  available_until: string;
  what_happened: string;
  current_energy: EnergyLevel;
  remaining_tasks?: Task[];
}

/**
 * Recovery plan response
 */
export interface RecoveryPlan {
  acknowledgment: string;
  next_tiny_step: string;
  revised_blocks: TimeBlock[];
  reflection_question?: string;
}
