import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2, APIGatewayProxyStructuredResultV2, Context } from "aws-lambda";


export class HttpError extends Error {
  constructor(public statusCode: number, public body?: any) {
    super(`Error with statusCode: ${statusCode} and body: ${body}`)
  }
}

type FuncType<T> = (event: APIGatewayProxyEventV2, context: Context) => Promise<T>;

export const handlerErrors = <T>(func: FuncType<T>): APIGatewayProxyHandlerV2 => {
  return async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
    try {
        return {
          statusCode: 200,
          body: JSON.stringify(await func(event, context))
        }
    } catch(e) {
      return {
        statusCode: e.statusCode || 500,
        body: e.body ? JSON.stringify(e.body) : `Something happens: ${e}`,
        headers: {
          'Content-Type': e.body ? 'application/json' : 'text/plain'
        }
      }
    }
  }
}
