import * as AWS  from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient({apiVersion: "2012-08-10"});
const TableName = process.env.STATE_TABLE_NAME;

export interface State {
  id: string,
  client_id: string,
  redirect_uri: string,
  scope: string
  response_type: string
  state: string
}


export const putState = async (Item: State): Promise<void> => {
  const result = await docClient.put({
    TableName,
    Item
  }).promise();
  if (result.$response.error) {
    console.error(`Could not put state ${Item.id}`, result.Attributes, result.$response.error)
    throw new Error(`Could not put state ${Item.id}`);
  }
}
