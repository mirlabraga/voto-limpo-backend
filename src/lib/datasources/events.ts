import * as AWS  from 'aws-sdk';
import { calendar_v3 } from 'googleapis';

const docClient = new AWS.DynamoDB.DocumentClient({apiVersion: "2012-08-10"});
const TableName = process.env.EVENTS_TABLE_NAME;

export interface Event {
  id: string
  supporterId: string
  date: string,
  googleCalendar?: calendar_v3.Schema$Event
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

export const putEvent = async (Item: Event): Promise<void> => {
  const result = await docClient.put({
    TableName,
    Item
  }).promise();

  if (result.$response.error) {
    console.error(`Could not put event ${Item}`, result.$response.error)
    throw new Error(`Could not put event ${Item}`);
  }
}

export const deleteEvent = async (Item: Event): Promise<void> => {
  const result = await docClient.delete({
    TableName,
    Key: {
      supporterId: Item.supporterId,
      id: Item.id
    }
  }).promise();

  if (result.$response.error) {
    console.error(`Could not delete event ${Item}`, result.$response.error)
    throw new Error(`Could not delete event ${Item}`);
  }
}

export const getEvent = async (supporterId: string, id: string): Promise<Event | null> => {
  const result = await docClient.get({
    TableName,
    Key: {
      supporterId,
      id
    }
  }).promise();

  if (result.$response.error) {
    console.error(`Could not get event supporterId: ${supporterId} - id: ${id}`, result.$response.error)
    throw new Error(`Could not get event supporterId: ${supporterId} - id: ${id}`);
  }
  return result.Item as Event;
}
