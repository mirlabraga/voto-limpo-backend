import 'source-map-support/register';
import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { v4 as uuid } from 'uuid';
import { handlerResponses, HttpError, HttpResult } from '../lib/handlerResponses';
import { deleteEvent, Event, getEvent, putEvent, queryEvents } from '../lib/datasources/events';
import { getSupporter, putSupporter, Supporter } from '../lib/datasources/supporter';
import { addAttendeeToEvent, createCalendarEvent, createVoteCalendarEvent } from '../lib/google/calendar';
import { Consent, putConsent } from '../lib/datasources/consent';
import { OTHER_SCOPES } from '../lib/oauth2';

export const fetch:APIGatewayProxyHandlerV2 = handlerResponses(
  async (event: APIGatewayProxyEventV2, _context) => {
    const supporterId = event.requestContext.authorizer['principalId'];
    const events = await queryEvents(supporterId);
    return events.map(({id, supporterId, date, googleCalendar}: Event) => {

      return {
        id,
        supporterId,
        date,
        googleCalendar: googleCalendar && {
          attendees: googleCalendar.attendees,
          conferenceData: googleCalendar.conferenceData && {
            entryPoints: googleCalendar.conferenceData?.entryPoints
          }
        }
      }
    });
  }
);

export const create:APIGatewayProxyHandlerV2 = handlerResponses(
  async (event: APIGatewayProxyEventV2, _context) => {
    const supporterId = event.requestContext.authorizer['principalId'];
    const { date } = JSON.parse(event.body);
    const eventItem: Event = {
      date,
      supporterId,
      id: uuid()
    }
    await putEvent(eventItem);
    return eventItem;
  }
);

export const destroy:APIGatewayProxyHandlerV2 = handlerResponses(
  async (event: APIGatewayProxyEventV2, _context) => {
    const supporterId = event.requestContext.authorizer['principalId'];
    const id = event.pathParameters?.id

    const eventItem = await getEvent(supporterId, id);
    if (!eventItem) {
      throw new HttpError(404);
    }
    await deleteEvent(eventItem);
    return new HttpResult(204);
  }
);

export const edit:APIGatewayProxyHandlerV2 = handlerResponses(
  async (event: APIGatewayProxyEventV2, _context) => {
    const supporterId = event.requestContext.authorizer['principalId'];
    const id = event.pathParameters?.id

    const eventItem = await getEvent(supporterId, id);
    if (!eventItem) {
      throw new HttpError(404);
    }
    const { date } = JSON.parse(event.body);
    const newEventItem = {
      ...eventItem,
      date
    };
    await putEvent(newEventItem);
    return newEventItem;
  }
);

export const createGoogleMeeting:APIGatewayProxyHandlerV2 = handlerResponses(
  async (event: APIGatewayProxyEventV2, _context) => {
    const supporterId = event.requestContext.authorizer['principalId'];
    const id = event.pathParameters?.id

    const eventItem = await getEvent(supporterId, id);
    if (!eventItem) {
      throw new HttpError(404);
    }
    const supporter = await getSupporter(supporterId);
    if (!supporter) {
      throw new HttpError(404);
    }


    eventItem.googleCalendar = await createCalendarEvent(supporter, eventItem);
    await putEvent(eventItem);

    return new HttpResult(204);
  }
);

const createAndSetMeetings = async(supporter: Supporter, eventItem: Event, emails: string[]) => {
  if (supporter.token?.scope.indexOf(OTHER_SCOPES.calendarEvents)) {
    if (!supporter.voteMeeting) {
      supporter.voteMeeting = await createVoteCalendarEvent(supporter);
    }
    supporter.voteMeeting = await addAttendeeToEvent(supporter, supporter.voteMeeting?.id, emails);
    await putSupporter(supporter);

    if (!eventItem.googleCalendar) {
      eventItem.googleCalendar = await createCalendarEvent(supporter, eventItem);
    }

    eventItem.googleCalendar = await addAttendeeToEvent(supporter, eventItem.googleCalendar.id, emails);
    await putEvent(eventItem);
  }
}

export const join:APIGatewayProxyHandlerV2 = handlerResponses(
  async (event: APIGatewayProxyEventV2, _context) => {
    const { eventId, id } = event.pathParameters || {}
    const { name, email, phoneNumber } =  JSON.parse(event.body);

    const eventItem = await getEvent(id, eventId);
    if (!eventItem) {
      throw new HttpError(404);
    }
    const supporter = await getSupporter(id);
    if (!supporter) {
      throw new HttpError(404);
    }

    const consent: Consent = {
      date: new Date().toISOString(),
      eventId,
      supporterId: id,
      name,
      email,
      phoneNumber
    }

    await putConsent(consent);

    await createAndSetMeetings(supporter, eventItem, [email]);

    return eventItem.googleCalendar?.conferenceData?.entryPoints?.find(_ => _.entryPointType == 'video') || {
      uri: eventItem.url
    }
  }
);

export const invite:APIGatewayProxyHandlerV2 = handlerResponses(
  async (event: APIGatewayProxyEventV2, _context) => {
    const supporterId = event.requestContext.authorizer['principalId'];
    const eventId = event.pathParameters?.id

    let emails:string[];
    try {
      emails =  JSON.parse(event.body).emails;
    } catch(e) {
      throw new HttpError(400, {error: 'invalid_body'})
    }
    console.log('got emails:', emails);

    const eventItem = await getEvent(supporterId, eventId);
    if (!eventItem) {
      throw new HttpError(404);
    }
    console.log('got event:', eventItem);

    const supporter = await getSupporter(supporterId);
    if (!supporter) {
      throw new HttpError(404);
    }
    console.log('got supporter:', supporter);

    eventItem.invites = eventItem.invites || [];
    eventItem.invites.push(...emails);
    await putEvent(eventItem);

    await createAndSetMeetings(supporter, eventItem, emails);

    return new HttpResult(204);
  }
);
