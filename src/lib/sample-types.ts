/** Serializable display data; no planner, schema or provider code enters the preview bundle. */
export interface SamplePlan {
  name: string;
  categoryLabel: string;
  dateLabel: string;
  location: string;
  guests: number;
  total: number;
  totalLabel: string;
  reserveLabel: string;
  budget: {
    id: string;
    label: string;
    percent: number;
    amount: number;
    amountLabel: string;
    color: string;
  }[];
  timeline: { id: string; title: string; detail: string; when: string }[];
  vendors: { id: string; title: string; detail: string }[];
}
export interface SampleProgress {
  completed: string[];
  vendors: Record<string, string>;
}
