import { EventDashboard } from "@/components/event-dashboard";
export const metadata = { title: "Your event plan" };
export default async function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return <EventDashboard eventId={eventId} />;
}
