import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Event } from "@shared/schema";

export function useEvents(cityId: number) {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['/api/cities', cityId, 'events'],
    enabled: !isNaN(cityId)
  });
  
  // Mutation to mark an event as read
  const markAsReadMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return apiRequest('PATCH', `/api/events/${eventId}/read`, {});
    },
    onSuccess: () => {
      // Invalidate events query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/cities', cityId, 'events'] });
    }
  });
  
  // Helper function to mark an event as read
  const markEventAsRead = (eventId: number) => {
    markAsReadMutation.mutate(eventId);
  };
  
  // Get unread events count
  const unreadCount = events?.filter(event => !event.read).length || 0;

  return {
    events: events || [],
    unreadCount,
    markEventAsRead,
    isLoading,
    isUpdating: markAsReadMutation.isPending,
    error
  };
}
