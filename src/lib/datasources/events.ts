import * as AWS  from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient({apiVersion: "2012-08-10"});
const TableName = process.env.EVENTS_TABLE_NAME;

export interface Event {
  id: string
  supporterId: string
  date: string
}

export const queryEvents = async (supporterId: string): Promise<Event[]> => {
  const result = await docClient.query({
    TableName,
    KeyConditionExpression: "supporterId = :supporterId",
    ExpressionAttributeValues: {
      ":supporterId": supporterId
    }
  }).promise();

  if (result.$response.error) {
    console.error(`Could not query events ${supporterId}`, result.$response.error)
    throw new Error(`Could not query events ${supporterId}`);
  }
  return result.Items as Event[];
}
