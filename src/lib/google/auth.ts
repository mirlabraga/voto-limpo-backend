import { google } from "googleapis";
import { Supporter } from "../datasources/supporter";
import { OAUTH_CONFIG } from "../oauth2";

export const getAuth = (supporter: Supporter) => {

    const auth = new google.auth.OAuth2(
      OAUTH_CONFIG.clientId,
      OAUTH_CONFIG.clientSecret,
      OAUTH_CONFIG.redirectUri
    );
    auth.setCredentials({
      refresh_token: supporter.token?.refresh_token
    });
  
    return auth;
  }