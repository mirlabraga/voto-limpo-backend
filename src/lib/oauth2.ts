import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import * as jwt from 'jsonwebtoken';

// const otherScopes = 'https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/calendar.events';
export const OAUTH_CONFIG = {
  signinUri: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  scope: "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
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

interface CertsKeyMap {
  [kid: string]: string
}

const CERTS_KEYS: Promise<CertsKeyMap> = fetch(OAUTH_CONFIG.auth_provider_x509_cert_url)
  .then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      return {};
    }
  });

const getCert = async (kid: string): Promise<string|null> => {
  return (await CERTS_KEYS)[kid];
}

export const validateJwt = async(jwtString: string): Promise<{ [key: string]: any }>  => {
  return new Promise((resolve, reject) => {
    const checkKey = async (headers, cb) => {
      console.log('getting cert for kid.', headers);
      const key = await getCert(headers.kid);
      cb(null, key);
    };

    jwt.verify(jwtString, checkKey, (error, decoded) => {
      console.log('decoded error:', error);
      console.log('decoded:', decoded);

      if (error) {
        reject(error);
      } else {
        if (typeof(decoded) == 'string') {
          reject('invalid body of token');
        }
        resolve(decoded);
      }
    });
  })
}

export const buildRedictURI = (state: string, scope: string): string => {
  const params = new URLSearchParams();
  params.append('client_id', OAUTH_CONFIG.clientId);
  params.append('redirect_uri', `${OAUTH_CONFIG.callbackUrlBase}/callback`);
  params.append('scope', scope);
  params.append('response_type', OAUTH_CONFIG.responseType);
  params.append('state', state);
  params.append('access_type', OAUTH_CONFIG.accessType);
  params.append('prompt', OAUTH_CONFIG.prompt);

  return `${OAUTH_CONFIG.signinUri}?${params.toString()}`;
}

export class Oauth2Error {
  constructor(public message: string) {}
}

export const validateCode = async (code: string, _state: string): Promise<OAuth2Token | Oauth2Error> => {
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', OAUTH_CONFIG.clientId);
  params.append('client_secret', OAUTH_CONFIG.clientSecret);
  params.append('redirect_uri', `${OAUTH_CONFIG.callbackUrlBase}/callback`);
  params.append('code', code);

  const response = await fetch(OAUTH_CONFIG.tokenUri, {
    method: 'post',
    body: params.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok) {
    console.error(`Couldn't Exchange code. StatusCode: ${response.status}. Body: ${await response.text()}`);
    return new Oauth2Error(`Couldn't Exchange code. StatusCode: ${response.status}`);
  }
  const token = await response.json() as OAuth2Token;
  if (!token.access_token) {
    return new Oauth2Error(`Invalid token.`);
  }
  return token;
}
