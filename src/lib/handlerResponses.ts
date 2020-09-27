import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2, APIGatewayProxyStructuredResultV2, Context } from "aws-lambda";


export class HttpError extends Error {
  constructor(public statusCode: number, public body?: any) {
    super(`Error with statusCode: ${statusCode} and body: ${body}`)
  }
}

export class HttpResult implements APIGatewayProxyStructuredResultV2 {
  constructor(public statusCode: number, public body?: string, public headers?: {[header: string]: boolean | number | string}) {

  }
}

type FuncType<T> = (event: APIGatewayProxyEventV2, context: Context) => Promise<T>;

export const handlerResponses = <T>(func: FuncType<T>): APIGatewayProxyHandlerV2 => {
  const commonHeaders = {
    'access-control-allow-origin': '*'
  }
  return async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
    try {
        const result = await func(event, context);
        const isHttpResult = result instanceof HttpResult;
        return {
          statusCode: isHttpResult ? result['statusCode'] : 200,
          body: isHttpResult ? result['body'] : JSON.stringify(result),
          headers: {
            ...commonHeaders,
            'Content-Type': 'application/json',
            ...(result['headers'] || {} ),
          }
        }
    } catch(e) {
      const customError = !!e.statusCode;
      const statusCode = customError ? e.statusCode : 500;
      const body = customError ? JSON.stringify(e.body) : `Something happens: ${e}`
      if (!customError) {
        console.error(`Somethig happens and throw and error`, e);
      }
      return {
        statusCode,
        body,
        headers: {
          ...commonHeaders,
          'Content-Type': e.body ? 'application/json' : 'text/plain'
        }
      }
    }
  }
}
