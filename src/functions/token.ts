import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getState } from "../lib/state";
import { validateCodeChallenge } from "../lib/oauth2Client";
import { URLSearchParams } from "url";

export const handler: APIGatewayProxyHandlerV2 = async (event: APIGatewayProxyEventV2, _context) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({error: "invalid_state", error_description: "invalid state"})
    };
  }
  const params = new URLSearchParams(event.body);

  const stateId = params.get('code');
  const clientState = params.get('state');
  const codeVerifier = params.get('code_verifier');

  const stateItem = await getState(stateId);
  const isValid = stateItem?.state == clientState
    && validateCodeChallenge(stateItem.code_challenge, codeVerifier);
  if (!isValid) {
    return {
      statusCode: 400,
      body: JSON.stringify({error: "invalid_state", error_description: "invalid state"})
    };
  }
  const {access_token, expires_in, id_token, token_type} = stateItem.token;
  return {
    statusCode: 400,
    body: JSON.stringify({
      access_token, expires_in, id_token, token_type
    })
  };
}
