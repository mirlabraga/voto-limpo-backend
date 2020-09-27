import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getSupporter } from "../lib/datasources/supporter";
import { getAllContacts } from "../lib/google/contacts";
import { handlerResponses, HttpError } from "../lib/handlerResponses";

export const currentProfileScope:APIGatewayProxyHandlerV2 = handlerResponses(
  async (event: APIGatewayProxyEventV2, _context) => {
    const supporterId = event.requestContext.authorizer['principalId'];
    const supporter = await getSupporter(supporterId);
    if (!supporter) {
      throw new HttpError(404);
    }
    return supporter.token?.scope?.split(" ") || [];
  }
);

export const contacts:APIGatewayProxyHandlerV2 = handlerResponses(
  async (event: APIGatewayProxyEventV2, _context) => {
    const supporterId = event.requestContext.authorizer['principalId'];
    const supporter = await getSupporter(supporterId);
    if (!supporter) {
      throw new HttpError(404);
    }
    return await getAllContacts(supporter);
  }
);
