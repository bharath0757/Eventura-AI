import { Wizard } from "@/components/wizard";
import { categories } from "@/lib/config";
export const metadata = { title: "Create your event" };
export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const query = await searchParams;
  const category = categories.find((c) => c === query.category);
  return <Wizard initialCategory={category} />;
}
