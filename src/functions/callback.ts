import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import 'source-map-support/register';
import { Oauth2Error, validateCode } from '../lib/oauth2';
import { buidRedirectUri as buidRedirectUriFromState, buidRedirectUriError } from '../lib/oauth2Client';
import { deleteState, getState, putState } from '../lib/datasources/state';
import { putSupporter, buildSpporterFromToken, getSupporter } from '../lib/datasources/supporter';

export const handler: APIGatewayProxyHandlerV2 = async (event: APIGatewayProxyEventV2, _context) => {
  if (!event.queryStringParameters) {
    return {
      statusCode: 400,
      body: JSON.stringify({error: "invalid_state", error_description: "invalid state"})
    };
  }

  const {code, state} = event.queryStringParameters;
  const stateItem = await getState(state);
  if (!stateItem) {
    return {
      statusCode: 400,
      body: JSON.stringify({error: "invalid_state", error_description: "invalid state"})
    };
  }

  if (stateItem.expire_at < new Date().getTime()) {
    await deleteState(stateItem);
    return {
      statusCode: 302,
      headers: {
        'Location': buidRedirectUriError(stateItem, 'invalid_token', 'invalid token')
      }
    };
  }

  try {
    console.log('validating code and state.', code, state);
    const token = await validateCode(code, state);
    console.log('got token', token);

    if (token instanceof Oauth2Error) {
      await deleteState(stateItem);
      return {
        statusCode: 302,
        headers: {
          'Location': buidRedirectUriError(stateItem, 'invalid_state', 'invalid state')
        }
      };
    }
    const supporterFromToken = await buildSpporterFromToken(token);
    stateItem.token = token;
    let supporter = await getSupporter(supporterFromToken.id);

    if (!supporter) {
      supporter = supporterFromToken;
    } else {
      const scopeFromToken = token.scope?.split(' ') || [];
      const scopeFromDb = supporter.token?.scope?.split(' ') || [];

      if (scopeFromToken.length > scopeFromDb.length) {
        supporter.token = token;
      }
    }

    await putState(stateItem);
    await putSupporter(supporter);
    return {
      statusCode: 302,
      headers: {
        'Location': buidRedirectUriFromState(stateItem)
      }
    };
  } catch(e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'something happens',
        error: e,
      }, null, 2),
    };
  }
}
