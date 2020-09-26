import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import 'source-map-support/register';
import { buildRedictURI } from '../lib/oauth2';
import { v4 as uuid } from 'uuid';
import { OAUTH_CONFIG } from '../lib/oauth2';
import { checkClient } from '../lib/oauth2Client';
import { putState } from '../lib/datasources/state';
import { handlerResponses, HttpError, HttpResult } from '../lib/handlerResponses';
import { getSupporter } from '../lib/datasources/supporter';

const redirect = async (event: APIGatewayProxyEventV2, scope: string) => {
  if (!event.queryStringParameters) {
    throw new HttpError(400, {error: "invalid_client", error_description: "invalid client config"});
  }

  const {client_id, redirect_uri, response_type, state, code_challenge} = event.queryStringParameters;

  const stateItem = {
    id: uuid(),
    client_id,
    redirect_uri,
    scope,
    response_type,
    state,
    code_challenge,
    expire_at: new Date().getTime() + (5 * 60 * 1000)
  };

  if (!checkClient(stateItem)) {
    throw new HttpError(400, {error: "invalid_client", error_description: "invalid client config"});
  }

  if (stateItem.response_type != 'code') {
    throw new HttpError(400, {error: "invalid_response_type", error_description: "invalid response type"});
  }

  await putState(stateItem);
  return new HttpResult(
    302,
    undefined,
    {
      Location: buildRedictURI(stateItem.id, stateItem.scope),
    }
  );
}

export const login: APIGatewayProxyHandlerV2 = handlerResponses(
  async (event: APIGatewayProxyEventV2, _context) => {
    return redirect(event, OAUTH_CONFIG.scope);
});

export const addScope: APIGatewayProxyHandlerV2 = handlerResponses(
  async (event: APIGatewayProxyEventV2, _context) => {
    const id = event.pathParameters?.id
    const scopeToBeAdded = event.queryStringParameters?.scope?.split(' ') || [];
    console.log('scopeToBeAdded:', scopeToBeAdded);
    const supporter = await getSupporter(id);
    if (!supporter) {
      throw new HttpError(400, {error: 'invalid_suppoter'})
    }
    const currentScopes = supporter.token?.scope.split(' ');
    for(let scope of scopeToBeAdded) {
      if (!currentScopes.includes(scope)) {
        currentScopes.push(scope);
      }
    }
    console.log('scope:', currentScopes);
    return redirect(event, currentScopes.join(' '));
});
