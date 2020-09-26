import { google } from "googleapis";
import { Event } from "../datasources/events";
import { Supporter } from "../datasources/supporter";
import { OAUTH_CONFIG } from "../oauth2";
import { v4 as uuid } from 'uuid';

const CANDIDATE_EMAIL = process.env.CANDIDATE_EMAIL;

export const createCalendarEvent = async (supporter: Supporter, event: Event) => {

  const auth = new google.auth.OAuth2(
    OAUTH_CONFIG.clientId,
    OAUTH_CONFIG.clientSecret,
    OAUTH_CONFIG.redirectUri
  );
  auth.setCredentials({
    refresh_token: supporter.token?.refresh_token
  });

  const calendar = google.calendar({ version: 'v3', auth });

  return await calendar.events.insert({
    auth,
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: 'Conversa com seu Candidato',
      attendees: [
        {
          email: CANDIDATE_EMAIL,
        },
        {
          email: supporter.email,
        }
      ],
      conferenceData: {
        createRequest: {
          requestId: uuid(),
          conferenceSolutionKey: {
            type: "hangoutsMeet"
          }
        }
      },
      start: {
        dateTime: event.date,
      },
      end: {
        dateTime: event.date,
      }
    }
  });
}
