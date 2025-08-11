import clientPromise from '../lib/mongodb';
import { MapPinIcon, ClockIcon } from '@heroicons/react/24/solid';
import { getServerSession } from 'next-auth';
import { authOptions } from '../lib/authOptions';
import { ObjectId } from 'mongodb';
import RsvpButton from './RsvpButton'; 

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  rsvpCount: number;
  hasRsvpd: boolean;
}

async function getEvents(userId?: string): Promise<Event[]> {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const aggregationPipeline = [
      { $sort: { date: 1, time: 1 } },

      {
        $lookup: {
          from: 'rsvps',
          localField: '_id',
          foreignField: 'eventId',
          as: 'rsvpsData',
        },
      },

      {
        $addFields: {
          rsvpCount: { $size: '$rsvpsData' },
          hasRsvpd: userId ? { $in: [new ObjectId(userId), '$rsvpsData.userId'] } : false,
        },
      },

      { $project: { rsvpsData: 0 } },
    ];

    const events = await db.collection('events').aggregate(aggregationPipeline).toArray();
    return JSON.parse(JSON.stringify(events));
  } catch (error) {
    console.error("Failed to fetch events", error);
    return [];
  }
}

export default async function EventList() {
  const session = await getServerSession(authOptions);
  const events = await getEvents(session?.user?.id);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-white">Upcoming Events</h2>
      <div className="space-y-4">
        {events.map((event) => (
          <div key={event._id} className="p-4 shadow-lg rounded-lg">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-white text-lg">{event.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                </div>
                <RsvpButton
                  eventId={event._id}
                  initialRsvpCount={event.rsvpCount}
                  hasRsvpd={event.hasRsvpd}
                />
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-300 mt-3 border-t border-gray-700 pt-3">
              <span className="flex items-center gap-1.5"><ClockIcon className="h-4 w-4"/> {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {event.time}</span>
              <span className="flex items-center gap-1.5"><MapPinIcon className="h-4 w-4"/> {event.location}</span>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-center text-gray-500 pt-8">No upcoming events. Create one to get started!</p>
        )}
      </div>
    </div>
  );
}