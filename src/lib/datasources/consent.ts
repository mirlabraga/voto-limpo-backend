import * as AWS  from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient({apiVersion: "2012-08-10"});
const TableName = process.env.CONSENT_TABLE_NAME;

export interface Consent {
    date: string
    supporterId: string
    eventId: string
    name: string
    phoneNumber: string
    email: string
}

export const putConsent = async (Item: Consent): Promise<void> => {
    const result = await docClient.put({
      TableName,
      Item
    }).promise();
  
    if (result.$response.error) {
      console.error(`Could not put consent ${Item}`, result.$response.error)
      throw new Error(`Could not put consent ${Item}`);
    }
  }
  