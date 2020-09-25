import { OAuth2Token, validateJwt } from "./oauth2";
import * as AWS  from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient({apiVersion: "2012-08-10"});
const TableName = process.env.SUPPORTER_TABLE_NAME;

export interface Supporter {
  id: string
  name: string
  email: string
  token?: OAuth2Token
}

export const buildSpporterFromToken = async (token: OAuth2Token) : Promise<Supporter> => {
  console.log('validating token', token.id_token);
  const claims =  await validateJwt(token.id_token);

  const supporter = {
    id: claims.sub,
    name: claims.name,
    email: claims.email,
    token: token
  }

  return supporter;
}

export const putSupporter = async (Item: Supporter) => {
  const result = await docClient.put({
    TableName,
    Item
  }).promise();

  if (result.$response.error) {
    console.error(`Could not put state ${Item.id}`, result.Attributes, result.$response.error)
    throw new Error(`Could not put state ${Item.id}`);
  }
}
