import { URLSearchParams } from "url";
import { State } from "./state";
import * as crypto from 'crypto';
import base64url from "base64url";

interface ClientConfig {
  redirectUrls: string[]
}

interface ClientConfigsMap {
  [clientId: string] : ClientConfig
}

const CLIENTS_CONFIGS = JSON.parse(process.env.CLIENTS_CONFIGS) as ClientConfigsMap;

export const checkClient = (state: State) => {
  const clientConfig = CLIENTS_CONFIGS[state.client_id];
  return clientConfig && clientConfig.redirectUrls.includes(state.redirect_uri);
}

export const buidRedirectUri = (state: State) => {
  const params = new URLSearchParams();
  params.append('code', state.id);
  params.append('state', state.state);

  return `${state.redirect_uri}?${params.toString()}`;
}

export const buidRedirectUriError = (state: State, error: string, description: string) => {
  const params = new URLSearchParams();
  params.append('error', error);
  params.append('error_description', description);

  return `${state.redirect_uri}?${params.toString()}`;
}

const sha256 = (buffer: string) => {
  return crypto.createHash('sha256').update(buffer).digest();
}

export const validateCodeChallenge = (codeChallenge: string, codeVerifier: string): boolean => {
  return base64url.encode(sha256(codeVerifier)) == codeChallenge;
}
