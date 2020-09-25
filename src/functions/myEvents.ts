import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { handlerErrors } from '../lib/utilErrorHandlers';
import 'source-map-support/register';

import { queryEvents } from '../lib/datasources/events';

export const getEvents = async (event: APIGatewayProxyEventV2, _context) => {
  const supporterId = event.requestContext.authorizer['principalId'];
  const events = await queryEvents(supporterId);
  return events;
}

export const handler: APIGatewayProxyHandlerV2 = handlerErrors(getEvents);