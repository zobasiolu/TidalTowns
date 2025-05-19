import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import EventCard from "@/components/events/event-card";
import { useEvents } from "@/hooks/use-events";
import { Event } from "@shared/schema";

export default function EventsPage() {
  const { id } = useParams();
  const cityId = parseInt(id, 10);
  
  const { events, markEventAsRead, isLoading, error } = useEvents(cityId);

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <h2 className="font-heading font-bold text-lg mb-4">Event Log</h2>
        <Skeleton className="h-24 mb-4 w-full" />
        <Skeleton className="h-24 mb-4 w-full" />
        <Skeleton className="h-24 mb-4 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Error Loading Events</h1>
            </div>
            <p className="text-gray-600">Unable to load the event log. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="eventLogView" className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 bg-white shadow-sm border-b border-gray-200">
        <h2 className="font-heading font-bold text-lg">Event Log</h2>
        <p className="text-sm text-gray-600">City activity and mayoral news bulletins</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50">
        <div className="space-y-4">
          {events.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-gray-500">No events logged yet. Check back after some city activity!</p>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onMarkAsRead={() => markEventAsRead(event.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
