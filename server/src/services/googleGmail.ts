import { google } from 'googleapis';
import { EmailSummary } from '../types/index.js';

function getMockEmailSummary(): EmailSummary {
  return {
    senders: [
      'sarah@example.com',
      'newsletter@cooking.com',
      'team@work.com',
    ],
    topics: [
      'New Italian restaurant opening downtown',
      'Weekend hiking trail recommendations',
      'Cooking class this Saturday',
    ],
    recentEmails: [
      { subject: 'New Italian restaurant opening downtown', from: 'sarah@example.com' },
      { subject: 'Your hiking gear order has shipped', from: 'orders@rei.com' },
      { subject: 'Weekend cooking class — spots available', from: 'newsletter@cooking.com' },
      { subject: 'Concert tickets on sale Friday', from: 'events@ticketmaster.com' },
      { subject: 'Q1 team offsite planning', from: 'team@work.com' },
    ],
  };
}

export const googleGmail = {
  getEmailSummary: async (userId: string): Promise<EmailSummary> => {
    // Use mock data if no real Google credentials
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_client_id') {
      return getMockEmailSummary();
    }

    try {
      // TODO: Get real OAuth token for user and fetch real emails
      return getMockEmailSummary();
    } catch (error) {
      console.error('Error fetching email summary:', error);
      return getMockEmailSummary();
    }
  },
};
