import { APIGatewayAuthorizerHandler, APIGatewayTokenAuthorizerEvent } from "aws-lambda";
import { validateJwt } from "../lib/oauth2";

interface PrincipalData {
  id: string
  context?: {[key: string]: string | number | boolean}
}
const generatePolicy = (principal: PrincipalData, effect: string, resource: string | string[]) => {
  return {
    "principalId": principal.id,
    "policyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Action": "execute-api:Invoke",
          "Effect": effect,
          "Resource": resource
        }
      ]
    },
    "context": principal.context || {}
  };
}


export const handler: APIGatewayAuthorizerHandler = async (event: APIGatewayTokenAuthorizerEvent, _context) => {
  try {
    console.log('arn:', event.methodArn);
    console.log('token:', event.authorizationToken);
    const tokenString = event.authorizationToken.split('Bearer ');
    const claims = await validateJwt(tokenString[1]);
    return generatePolicy({
      id: claims.sub,
      context: {
        name: claims.name,
        email: claims.email
      }
    }, 'Allow', event.methodArn);
  } catch (error) {
    return generatePolicy({id: 'user'}, 'Deny', event.methodArn);
  }
}
