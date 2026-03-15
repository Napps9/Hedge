import { google } from 'googleapis';
import { CalendarEvent } from '../types/index.js';
import { db } from '../db/index.js';

function getMockCalendarEvents(): CalendarEvent[] {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  return [
    {
      id: 'mock-1',
      summary: 'Team standup',
      startTime: new Date(now.getTime() + 1 * day),
      endTime: new Date(now.getTime() + 1 * day + 30 * 60 * 1000),
      description: 'Daily sync',
      location: null,
    },
    {
      id: 'mock-2',
      summary: 'Lunch with Sarah',
      startTime: new Date(now.getTime() + 2 * day),
      endTime: new Date(now.getTime() + 2 * day + 60 * 60 * 1000),
      description: null,
      location: 'Downtown',
    },
    {
      id: 'mock-3',
      summary: 'Dentist appointment',
      startTime: new Date(now.getTime() + 3 * day),
      endTime: new Date(now.getTime() + 3 * day + 60 * 60 * 1000),
      description: null,
      location: '123 Main St',
    },
    {
      id: 'mock-4',
      summary: 'Weekend brunch',
      startTime: new Date(now.getTime() + 5 * day),
      endTime: new Date(now.getTime() + 5 * day + 90 * 60 * 1000),
      description: 'With college friends',
      location: null,
    },
  ];
}

export const googleCalendar = {
  getUpcomingEvents: async (userId: string): Promise<CalendarEvent[]> => {
    // Use mock data if no real Google credentials
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_client_id') {
      return getMockCalendarEvents();
    }

    try {
      const calendar = google.calendar('v3');
      // TODO: Get real OAuth token for user and fetch real events
      // For now, return mock data as fallback
      return getMockCalendarEvents();
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return getMockCalendarEvents();
    }
  },
};
