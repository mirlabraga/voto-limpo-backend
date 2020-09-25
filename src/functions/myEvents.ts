import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { handlerErrors } from '../lib/utilErrorHandlers';

import 'source-map-support/register';
import { validateCredentials } from '../lib/credentials';
import { queryEvents } from '../lib/datasources/events';

export const getEvents = async (event: APIGatewayProxyEventV2, _context) => {
  const supporter = await validateCredentials(event);
  const events = await queryEvents(supporter.id);

  return events;
}

export const handler: APIGatewayProxyHandlerV2 = handlerErrors(getEvents);
