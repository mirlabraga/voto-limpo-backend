import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import { validateCode } from '../lib/oauth2';

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent, _context) => {
  const {code, state} = event.queryStringParameters;
  try {
    return {
      statusCode: 200,
      body: JSON.stringify(await validateCode(code, state), null, 2),
    };
  } catch(e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'something happens',
        input: event,
      }, null, 2),
    };
  }
}
