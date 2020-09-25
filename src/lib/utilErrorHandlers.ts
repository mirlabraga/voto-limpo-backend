import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2, APIGatewayProxyStructuredResultV2, Callback, Context } from "aws-lambda";


export class HttpError extends Error {
  constructor(statusCode: number, body?: string) {
    super(`Error with statusCode: ${statusCode} and body: ${body}`)
  }
}

type FuncType<T> = (event: APIGatewayProxyEventV2, context: Context) => Promise<T>;

export const handlerErrors = <T>(func: FuncType<T>): APIGatewayProxyHandlerV2 => {

  return (event: APIGatewayProxyEventV2, context: Context) => {
    try {
      const promise = func(event, context);
      promise.then((result: T) => {
        return {
          statusCode: 200,
          body: JSON.stringify(result)
        }
      })
    } catch(e) {
      return {
        statusCode: e.statusCode || 500,
        body: e.body || `Something happens: ${e}`
      } as APIGatewayProxyStructuredResultV2
    }
  }
}
