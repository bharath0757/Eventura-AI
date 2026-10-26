import { applyProposal, type BudgetProposal } from "@/lib/ai/optimizer";
import {
  recommendationSchema,
  sourceSchema,
  type Recommendation,
  type Source,
} from "@/lib/ai/contracts";
import { recordStore, StorageError, type StoragePort } from "./records";

export { STORAGE_KEY, StorageError } from "./records";
export type { EventSnapshot, StoragePort } from "./records";

/** Assistant-aware facade. Basic planning screens import the record store directly. */
export function eventStore(storage?: StoragePort, clock = () => new Date().toISOString()) {
  const store = recordStore(storage, clock);
  return {
    ...store,
    acceptProposal(id: string, proposal: BudgetProposal) {
      return store.update(id, (r) => applyProposal(r, proposal));
    },
    retainIdea(id: string, input: Recommendation, mode: Source) {
      const idea = recommendationSchema.parse(input),
        source = sourceSchema.parse(mode);
      return store.update(id, (r) => {
        if (!r.plan.budget.some((b) => b.category === idea.category))
          throw new StorageError("This idea references an unknown budget category.");
        const saved = r.savedIdeas ?? [];
        if (
          saved.some(
            (s) =>
              s.idea.category === idea.category &&
              s.idea.title.toLowerCase() === idea.title.toLowerCase(),
          )
        )
          return r;
        if (saved.length >= 30)
          throw new StorageError("You can retain up to 30 assistant ideas per event.");
        return { ...r, savedIdeas: [...saved, { idea, source, savedAt: clock() }] };
      });
    },
  };
}
