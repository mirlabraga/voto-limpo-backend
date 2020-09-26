import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import { deleteState, getState } from "../lib/datasources/state";
import { validateCodeChallenge } from "../lib/oauth2Client";
import { URLSearchParams } from "url";

export const handler: APIGatewayProxyHandlerV2 = async (event: APIGatewayProxyEventV2, _context) => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "invalid_state", error_description: "invalid state" })
    };
  }
  const params = new URLSearchParams(event.body);

  const stateId = params.get('code');
  const clientState = params.get('state');
  const codeVerifier = params.get('code_verifier');

  const stateItem = await getState(stateId);
  if (!stateItem) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "invalid_state", error_description: "invalid state" })
    };
  }
  const isSame = stateItem?.state == clientState;
  const isValid = validateCodeChallenge(stateItem.code_challenge, codeVerifier);
  const { access_token, expires_in, id_token, token_type } = stateItem.token;
  await deleteState(stateItem);
  if (!isValid || !isSame) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "invalid_state", error_description: "invalid state" })
    };
  }
  return {
    statusCode: 400,
    body: JSON.stringify({
      access_token, expires_in, id_token, token_type
    })
  };
}
