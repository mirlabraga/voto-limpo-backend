import 'source-map-support/register';
import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { v4 as uuid } from 'uuid';
import { handlerResponses, HttpError, HttpResult } from '../lib/handlerResponses';
import { deleteEvent, Event, getEvent, putEvent, queryEvents } from '../lib/datasources/events';


export const fetch:APIGatewayProxyHandlerV2 = handlerResponses(
  async (event: APIGatewayProxyEventV2, _context) => {
    const supporterId = event.requestContext.authorizer['principalId'];
    const events = await queryEvents(supporterId);
    return events;
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
