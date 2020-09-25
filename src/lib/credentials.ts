import { APIGatewayProxyEventV2 } from "aws-lambda";
import { Supporter } from "./supporter";
import { HttpError } from "./utilErrorHandlers";


export const validateCredentials = async (_event: APIGatewayProxyEventV2): Promise<Supporter> => {
  throw new HttpError(401, 'invalid authorization');
}
