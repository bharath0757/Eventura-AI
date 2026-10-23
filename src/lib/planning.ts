import type { EventCategory } from '@/types';

export interface PlannerBrief {
  category: EventCategory;
  name: string;
  date: string;
  location: string;
  guests: number;
  budget: number;
  style: string;
  priorities: string[];
}

export interface PlanProgress {
  completed: string[];
  vendors: Record<string, string>;
}

export const SAMPLE_BRIEF: PlannerBrief = {
  category: 'wedding', name: 'A day to remember', date: '2027-02-14', location: 'Bengaluru', guests: 150, budget: 500000, style: 'Garden & romantic', priorities: ['Food & drinks', 'The atmosphere'],
};

export const CATEGORY_NAMES = { wedding: 'Wedding', birthday: 'Birthday', community: 'Community gathering' } as const;
export const STYLES = ['Garden & romantic', 'Modern & minimal', 'Colourful & playful', 'Classic & elegant'];
export const PRIORITIES = ['Food & drinks', 'The atmosphere', 'Great entertainment', 'Capturing memories'];

export function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export function budgetBreakdown(brief: PlannerBrief) {
  const weights = brief.category === 'wedding' ? [32, 28, 12, 10, 8, 10] : brief.category === 'birthday' ? [22, 30, 16, 8, 14, 10] : [25, 25, 10, 8, 22, 10];
  const priorityIndexes = [1, 2, 4, 3];
  brief.priorities.forEach((priority) => {
    const target = priorityIndexes[PRIORITIES.indexOf(priority)];
    if (target !== undefined) { weights[0] -= 2; weights[target] += 2; }
  });
  const labels = ['Venue & rentals', 'Food & drinks', 'Décor & flowers', 'Photography', 'Entertainment', 'Just-in-case fund'];
  let allocated = 0;
  return labels.map((label, index) => {
    const amount = index === labels.length - 1 ? brief.budget - allocated : Math.round(brief.budget * weights[index] / 100);
    allocated += amount;
    return { label, percent: weights[index], amount, color: ['#416655', '#dca78a', '#9eaf98', '#e7c866', '#a5a7c7', '#e7e8df'][index] };
  });
}

export function planTasks(brief: PlannerBrief) {
  return [
    { title: 'Shortlist a venue', when: 'Start here', detail: `Find a space in ${brief.location} for ${brief.guests} guests.` },
    { title: 'Choose your food & drinks', when: 'Next up', detail: 'Ask for menus, estimates, and dietary options.' },
    { title: `Bring your ${brief.style.toLowerCase()} style to life`, when: 'Make it yours', detail: 'Collect references and agree on a décor budget.' },
    { title: 'Send invitations & collect RSVPs', when: 'Before the day', detail: 'Confirm guest numbers and share the event details.' },
    { title: 'Confirm every little detail', when: 'The final week', detail: 'Reconfirm vendors, arrival times, and a weather backup.' },
  ];
}

export function isPlannerBrief(value: unknown): value is PlannerBrief {
  if (!value || typeof value !== 'object') return false;
  const b = value as Record<string, unknown>;
  return ['wedding', 'birthday', 'community'].includes(String(b.category)) && typeof b.name === 'string' && b.name.trim().length > 0 && b.name.length <= 100 && typeof b.location === 'string' && b.location.trim().length > 0 && b.location.length <= 100 && typeof b.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.date) && Number.isFinite(Date.parse(b.date)) && typeof b.budget === 'number' && Number.isInteger(b.budget) && b.budget >= 1000 && b.budget <= 100000000 && typeof b.guests === 'number' && Number.isInteger(b.guests) && b.guests >= 1 && b.guests <= 100000 && typeof b.style === 'string' && STYLES.includes(b.style) && Array.isArray(b.priorities) && b.priorities.length <= PRIORITIES.length && new Set(b.priorities).size === b.priorities.length && b.priorities.every(p => typeof p === 'string' && PRIORITIES.includes(p));
}
