/**
 * Task difficulty levels for the gamified project planner
 */
export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

/**
 * Task object structure for gamified project planning
 * Each task represents a unit of work with gamification elements
 */
export interface Task {
  /** Unique identifier for the task */
  id: string;
  
  /** Short, descriptive name of the task */
  name: string;
  
  /** Simple description explaining what the task involves */
  description: string;
  
  /** Experience points awarded upon completion */
  xp: number;
  
  /** Difficulty level of the task */
  difficulty: TaskDifficulty;
  
  /** Helpful hints or tips for completing the task */
  hints: string[];
  
  /** Tools, technologies, or resources needed for the task */
  tools: string[];
  
  /** Estimated time to complete (in hours) */
  timeEstimate: number;
}

/**
 * Project plan containing multiple tasks
 */
export interface ProjectPlan {
  /** Name of the project */
  projectName: string;
  
  /** Brief overview of the project */
  projectDescription: string;
  
  /** List of tasks that make up the project */
  tasks: Task[];
  
  /** Total XP available in the project */
  totalXP: number;
  
  /** Estimated total time for project completion */
  totalTime: number;
}

/**
 * Chat message structure for conversation history
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
