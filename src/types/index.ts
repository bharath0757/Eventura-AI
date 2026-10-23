/**
 * Eventura AI — Core type definitions
 *
 * These types define the consistent data model used across
 * event creation, planning, dashboard rendering, and persistence.
 */

/** Supported event categories */
export type EventCategory = 'wedding' | 'birthday' | 'community';

/** A single budget line item */
export interface BudgetItem {
  id: string;
  category: string;
  label: string;
  estimatedCost: number;
  allocatedBudget: number;
  isLocked: boolean;
  notes?: string;
}

/** A task on the planning timeline */
export interface TimelineTask {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO 8601
  completedDate?: string; // ISO 8601
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  category: string;
  priority: 'low' | 'medium' | 'high';
}

/** A vendor-related task or contact */
export interface VendorTask {
  id: string;
  vendorType: string;
  taskDescription: string;
  status: 'not-started' | 'researching' | 'contacted' | 'booked' | 'confirmed';
  estimatedCost?: number;
  notes?: string;
  dueDate?: string; // ISO 8601
}

/** A personalized theme or activity idea */
export interface PersonalizedIdea {
  id: string;
  title: string;
  description: string;
  category: 'theme' | 'activity' | 'decoration' | 'food' | 'entertainment';
  estimatedCost?: number;
  source: 'ai' | 'template';
}

/** A risk assessment with contingency recommendation */
export interface RiskRecommendation {
  id: string;
  riskTitle: string;
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  category: string;
}

/** User-provided event details (wizard output) */
export interface EventBrief {
  id: string;
  eventCategory: EventCategory;
  eventName: string;
  eventDate: string; // ISO 8601
  location: string;
  guestCount: number;
  totalBudget: number;
  preferences: string[];
  priorities: string[];
  additionalNotes?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** Complete generated event plan */
export interface EventPlan {
  id: string;
  briefId: string;
  budgetItems: BudgetItem[];
  timeline: TimelineTask[];
  vendorTasks: VendorTask[];
  personalizedIdeas: PersonalizedIdea[];
  riskRecommendations: RiskRecommendation[];
  totalBudget: number;
  allocatedTotal: number;
  remainingBudget: number;
  generatedAt: string; // ISO 8601
  lastModifiedAt: string; // ISO 8601
  source: 'ai' | 'demo-fallback';
}
