// Google Calendar Integration
// Used for creating reminder events when posts go live

import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function createPostReminder(
  title: string,
  category: string,
  scheduledDate: Date,
  postId: number
): Promise<string | null> {
  try {
    const calendar = await getUncachableGoogleCalendarClient();
    
    const eventStart = new Date(scheduledDate);
    const eventEnd = new Date(scheduledDate);
    eventEnd.setMinutes(eventEnd.getMinutes() + 30);

    const event = {
      summary: `📱 Post Going Live: ${title}`,
      description: `Your ${category} post is going live now!\n\nHop on Instagram to engage with early comments and boost your reach.\n\nPost ID: ${postId}`,
      start: {
        dateTime: eventStart.toISOString(),
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: eventEnd.toISOString(),
        timeZone: 'America/Los_Angeles',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 5 },
          { method: 'popup', minutes: 0 },
        ],
      },
      colorId: category === 'Family' || category === 'Parenting' ? '11' : '9',
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    console.log(`Calendar event created: ${response.data.id}`);
    return response.data.id || null;
  } catch (error) {
    console.error('Failed to create calendar reminder:', error);
    return null;
  }
}

export async function deletePostReminder(eventId: string): Promise<boolean> {
  try {
    const calendar = await getUncachableGoogleCalendarClient();
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    return true;
  } catch (error) {
    console.error('Failed to delete calendar reminder:', error);
    return false;
  }
}
