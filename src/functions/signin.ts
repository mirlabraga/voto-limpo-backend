import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import 'source-map-support/register';
import { buildRedictURI } from '../lib/oauth2';

export const handler: APIGatewayProxyHandlerV2 = async (_event, _context) => {
  return {
    statusCode: 302,
    headers: {
      Location: buildRedictURI(),
    }
  };
}
