import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import 'source-map-support/register';
import { buildRedictURI } from '../lib/oauth2';
import { v4 as uuid } from 'uuid';
import { checkClient } from '../lib/oauth2Client';
import { putState } from '../lib/state';

export const handler: APIGatewayProxyHandlerV2 = async (event: APIGatewayProxyEventV2, _context) => {

  if (!event.queryStringParameters) {
    return {
      statusCode: 400,
      body: JSON.stringify({error: "invalid_client", error_description: "invalid client config"})
    };
  }

  const {client_id, redirect_uri, scope, response_type, state} = event.queryStringParameters;

  const stateItem = {
    id: uuid(),
    client_id,
    redirect_uri,
    scope,
    response_type,
    state
  };

  if (!checkClient(stateItem)) {
    return {
      statusCode: 400,
      body: JSON.stringify({error: "invalid_client", error_description: "invalid client config"})
    };
  }

  if (stateItem.response_type != 'code') {
    return {
      statusCode: 400,
      body: JSON.stringify({error: "invalid_response_type", error_description: "invalid response type"})
    };
  }

  try {
    await putState(stateItem);
    return {
      statusCode: 302,
      headers: {
        Location: buildRedictURI(stateItem.id),
      }
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({error: "internal_error", error_description: error.toString()})
    };
  }
}
