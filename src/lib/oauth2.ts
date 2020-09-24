import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { v4 as uuid } from 'uuid';

const config = {
  signinUri: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUri: 'https://oauth2.googleapis.com/token',
  scope: 'openid profile email phone address https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/calendar',
  responseType: 'code',
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET_KEY,
  accessType: 'offline',
  prompt: 'consent',
  callbackUrlBase: process.env.BASE_URL
}

export interface OAuth2Token {
  access_token: string,
  expires_in: number,
  scope?: string,
  token_type: string,
  id_token?: string
}

export const buildRedictURI = (): string => {
  return `${config.signinUri}?client_id=${config.clientId}&redirect_uri=${config.callbackUrlBase}/callback&scope=${config.scope}&response_type=${config.responseType}&state=${uuid()}&access_type=${config.accessType}&prompt=${config.prompt}`;
}

export const validateCode = async (code: string, _state: string): Promise<OAuth2Token> => {
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', config.clientId);
  params.append('client_secret', config.clientSecret);
  params.append('redirect_uri', `${config.callbackUrlBase}/callback`);
  params.append('code', code);

  const response = await fetch(config.tokenUri, {
    method: 'post',
    body: params.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok) {
    console.error(`Couldn't Exchange code. StatusCode: ${response.status}. Body: ${await response.text()}`);
    throw new Error(`Couldn't Exchange code. StatusCode: ${response.status}`);
  }
  return await response.json() as OAuth2Token;
}
