import CreateEventForm from "../../../components/CreateEventForm";
import EventList from "../../../components/EventList";

export default function EventsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Campus Events</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <EventList />
        </div>
        <div>
          <CreateEventForm />
        </div>
      </div>
    </div>
  );
}