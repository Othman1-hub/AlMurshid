/**
 * Client-side utilities for interacting with the AI endpoints
 * Use these in your frontend components
 */

import { ChatMessage, ProjectPlan } from '@/lib/types/task';

/**
 * Send a message to the chat endpoint and get streaming response
 * 
 * @param messages - Full conversation history
 * @returns Response object with streaming body
 * 
 * @example
 * ```typescript
 * const response = await sendChatMessage(messages);
 * const reader = response.body?.getReader();
 * // Handle streaming response
 * ```
 */
export async function sendChatMessage(messages: ChatMessage[]): Promise<Response> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send chat message');
  }

  return response;
}

/**
 * Generate a project plan from conversation history
 * 
 * @param messages - Full conversation history
 * @returns ProjectPlan object with structured tasks
 * 
 * @example
 * ```typescript
 * const plan = await generateProjectPlan(messages);
 * console.log(`Generated ${plan.tasks.length} tasks`);
 * console.log(`Total XP: ${plan.totalXP}`);
 * ```
 */
export async function generateProjectPlan(messages: ChatMessage[]): Promise<ProjectPlan> {
  const response = await fetch('/api/generate-plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate project plan');
  }

  return response.json();
}

/**
 * Format XP number with comma separators
 */
export function formatXP(xp: number): string {
  return xp.toLocaleString();
}

/**
 * Get difficulty color for UI badges
 */
export function getDifficultyColor(difficulty: string): string {
  const colors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-orange-100 text-orange-800',
    expert: 'bg-red-100 text-red-800',
  };
  return colors[difficulty as keyof typeof colors] || colors.medium;
}

/**
 * Format time estimate to readable string
 */
export function formatTimeEstimate(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  if (hours === 1) {
    return '1 hour';
  }
  if (hours < 8) {
    return `${hours} hours`;
  }
  const days = Math.floor(hours / 8);
  const remainingHours = hours % 8;
  if (remainingHours === 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  return `${days}d ${remainingHours}h`;
}
