import { State } from "./state";

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
