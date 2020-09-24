import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import 'source-map-support/register';
import { Oauth2Error, validateCode } from '../lib/oauth2';
import { buidRedirectUri as buidRedirectUriFromState } from '../lib/oauth2Client';
import { getState } from '../lib/state';
import { putSupporter, buildSpporterFromToken } from '../lib/supporter';

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

  try {
    console.log('validating code and state.', code, state);
    const token = await validateCode(code, state);
    console.log('got token', token);

    if (token instanceof Oauth2Error) {
      return {
        statusCode: 400,
        body: JSON.stringify({error: "invalid_token", error_description: "invalid token"})
      };
    }
    const supporter = await buildSpporterFromToken(token);
    console.log('build supporter', supporter);
    await putSupporter(supporter);
    console.log('supporter saved', supporter);
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
