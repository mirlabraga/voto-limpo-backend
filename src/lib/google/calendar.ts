import { calendar_v3, google } from "googleapis";
import { Event } from "../datasources/events";
import { Supporter } from "../datasources/supporter";
import { v4 as uuid } from 'uuid';
import { parseZone } from 'moment';
import { getAuth } from "./auth";

const CANDIDATE_EMAIL = process.env.CANDIDATE_EMAIL;
const CANDIDATE_NAME = process.env.CANDIDATE_NAME;
const CANDIDATE_VOTE_NUMBER = process.env.CANDIDATE_VOTE_NUMBER;
const ELECTION_DATE = process.env.ELECTION_DATE;
const calendarId = 'primary';


export const createVoteCalendarEvent = async (supporter: Supporter): Promise<calendar_v3.Schema$Event> => {

  const auth = getAuth(supporter)

  const calendar = google.calendar({ version: 'v3', auth });

  const result = await calendar.events.insert({
    auth,
    calendarId,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: {
      summary: `Votar ${CANDIDATE_VOTE_NUMBER} - ${CANDIDATE_NAME}, o meu candidato!`,
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
        dateTime: ELECTION_DATE,
      },
      end: {
        dateTime: parseZone(ELECTION_DATE).add(10, 'hours').toISOString(),
      }
    }
  });

  return result.data;
}

export const createCalendarEvent = async (supporter: Supporter, event: Event): Promise<calendar_v3.Schema$Event> => {

  const auth = getAuth(supporter)

  const calendar = google.calendar({ version: 'v3', auth });

  const result = await calendar.events.insert({
    auth,
    calendarId,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: {
      summary: `Bate-papo com ${CANDIDATE_NAME}, o meu candidato!`,
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

  return result.data;
}

export const getCalendarEvent = async(supporter: Supporter, eventId: string): Promise<calendar_v3.Schema$Event | null> => {
  const auth = getAuth(supporter)

  const calendar = google.calendar({ version: 'v3', auth });

  const result = await calendar.events.get({
    calendarId,
    eventId
  });
  return result.data
}

export const addAttendeeToEvent = async(supporter: Supporter, eventId: string, email: string):  Promise<calendar_v3.Schema$Event> => {
  

  const auth = getAuth(supporter)
  const calendar = google.calendar({ version: 'v3', auth });

  const eventData = await getCalendarEvent(supporter, eventId);
  if (!eventData) {
    throw new Error('Could not get Event');
  }

  eventData.attendees = eventData.attendees  || [];
  eventData.attendees.push({
    email
  })

  const response = await calendar.events.patch({
    eventId,
    calendarId,
    sendUpdates: 'all',
    requestBody: eventData
  });
  
  return response.data;
}

