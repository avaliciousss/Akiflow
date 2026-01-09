import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { TimeBlocker } from './engine/time-blocker.js';
import { SessionManager } from './engine/session-manager.js';
import {
  PlanningInput,
  Task,
  DerailmentRecovery,
  CheckIn,
} from './types/index.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize engines
const timeBlocker = new TimeBlocker();
const sessionManager = new SessionManager();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'ADHD Time-Blocking Copilot' });
});

/**
 * POST /api/plan
 * Generate a time-blocked schedule plan
 */
app.post('/api/plan', (req: Request, res: Response) => {
  try {
    const input: PlanningInput = req.body;

    // Validate required fields
    if (!input.available_start || !input.available_end || !input.tasks) {
      return res.status(400).json({
        error: 'Missing required fields: available_start, available_end, tasks',
      });
    }

    const plan = timeBlocker.generatePlan(input);
    res.json(plan);
  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({ error: 'Failed to generate plan' });
  }
});

/**
 * POST /api/sessions/start
 * Start a new live focus session
 */
app.post('/api/sessions/start', (req: Request, res: Response) => {
  try {
    const { task, duration_minutes } = req.body;

    if (!task || !duration_minutes) {
      return res.status(400).json({
        error: 'Missing required fields: task, duration_minutes',
      });
    }

    const session = sessionManager.startSession(task, duration_minutes);
    res.json({
      session,
      message: `Session started! ${session.steps[0]}`,
      next_steps: session.steps.slice(0, 3),
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

/**
 * GET /api/sessions/:sessionId
 * Get session details
 */
app.get('/api/sessions/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = sessionManager.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

/**
 * POST /api/sessions/:sessionId/checkin
 * Record a check-in during a session
 */
app.post('/api/sessions/:sessionId/checkin', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const checkInData: Omit<CheckIn, 'timestamp'> = req.body;

    const checkIn = sessionManager.recordCheckIn(sessionId, checkInData);

    // Get updated next steps
    const nextSteps = sessionManager.getNextSteps(sessionId);

    res.json({
      check_in: checkIn,
      next_steps: nextSteps,
      encouragement: generateEncouragement(checkIn),
    });
  } catch (error) {
    console.error('Error recording check-in:', error);
    res.status(500).json({ error: 'Failed to record check-in' });
  }
});

/**
 * POST /api/sessions/:sessionId/complete-step
 * Mark the current step as complete
 */
app.post('/api/sessions/:sessionId/complete-step', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = sessionManager.completeStep(sessionId);

    res.json({
      completed_step: result.completed,
      next_steps: result.next,
      message: `Great! You completed: ${result.completed}`,
    });
  } catch (error) {
    console.error('Error completing step:', error);
    res.status(500).json({ error: 'Failed to complete step' });
  }
});

/**
 * POST /api/sessions/:sessionId/end
 * End a session
 */
app.post('/api/sessions/:sessionId/end', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;

    const session = sessionManager.endSession(sessionId, status || 'completed');

    res.json({
      session,
      message:
        status === 'abandoned'
          ? 'No worries - you showed up and tried. That matters.'
          : 'Session complete! Nice work.',
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

/**
 * GET /api/sessions
 * Get all active sessions
 */
app.get('/api/sessions', (req: Request, res: Response) => {
  try {
    const sessions = sessionManager.getActiveSessions();
    res.json({ active_sessions: sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/**
 * POST /api/recovery
 * Create a recovery plan after derailment
 */
app.post('/api/recovery', (req: Request, res: Response) => {
  try {
    const recovery: DerailmentRecovery = req.body;

    if (!recovery.current_time || !recovery.available_until || !recovery.current_energy) {
      return res.status(400).json({
        error: 'Missing required fields: current_time, available_until, current_energy',
      });
    }

    const recoveryPlan = sessionManager.createRecoveryPlan(recovery);
    res.json(recoveryPlan);
  } catch (error) {
    console.error('Error creating recovery plan:', error);
    res.status(500).json({ error: 'Failed to create recovery plan' });
  }
});

/**
 * GET /api/prompt
 * Get the system prompt configuration
 */
app.get('/api/prompt', (req: Request, res: Response) => {
  try {
    // In production, you'd read from the config file
    res.json({
      message: 'System prompt available at /docs/SYSTEM_PROMPT.md',
      principles: [
        'ADHD-friendly design',
        'Time blocking with breaks',
        'Monotasking focus',
        'Start with easy wins',
        'Non-judgmental support',
      ],
    });
  } catch (error) {
    console.error('Error fetching prompt:', error);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
});

/**
 * Helper: Generate encouragement based on check-in
 */
function generateEncouragement(checkIn: CheckIn): string {
  const energyMessages = {
    low: "You're doing great even with low energy. Every bit of progress counts.",
    medium: 'Nice work keeping steady. You got this.',
    high: 'Love the energy! Keep that momentum going.',
  };

  const actionMessages = {
    keep_going: 'Perfect - let\'s keep the rhythm going.',
    shrink_plan: 'Smart adjustment. Smaller steps are totally fine.',
    switch_task: 'Good call switching things up when needed.',
  };

  return `${energyMessages[checkIn.energy_level]} ${actionMessages[checkIn.continue_or_adjust]}`;
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ADHD Time-Blocking Copilot running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   - POST /api/plan - Generate time-blocked schedule`);
  console.log(`   - POST /api/sessions/start - Start focus session`);
  console.log(`   - POST /api/recovery - Create recovery plan`);
  console.log(`   - GET  /health - Health check`);
  console.log(`\n💙 ADHD-friendly time management at your service!`);
});

export default app;
