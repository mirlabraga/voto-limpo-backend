import { v4 as uuid } from 'uuid';

const config = {
  signinUri: 'https://accounts.google.com/o/oauth2/v2/auth',
  scope: 'openid profile email phone address https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/calendar',
  responseType: 'code',
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET_KEY,
  accessType: 'offline',
  prompt: 'consent',
  callbackUrlBase: process.env.BASE_URL
}

export const buildRedictURI = () => {
  return `${config.signinUri}?client_id=${config.clientId}&redirect_uri=${config.callbackUrlBase}/callback&scope=${config.scope}&response_type=${config.responseType}&state=${uuid()}&access_type=${config.accessType}&prompt=${config.prompt}`;
}
