import { Configuration, LogLevel, PublicClientApplication } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_AZURE_AD_CLIENT_ID as string;
const tenantId = import.meta.env.VITE_AZURE_AD_TENANT_ID as string;
const backendAppIdUri = import.meta.env.VITE_BACKEND_API_APP_ID_URI as string;

if (!clientId || !tenantId || !backendAppIdUri) {
  // eslint-disable-next-line no-console
  console.warn(
    "[MSAL] One or more required env vars are missing: VITE_AZURE_AD_CLIENT_ID, VITE_AZURE_AD_TENANT_ID, VITE_BACKEND_API_APP_ID_URI"
  );
}

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (!containsPii) console.log(`[MSAL] ${level}: ${message}`);
      },
      logLevel: LogLevel.Info
    }
  }
};

export const loginRequest = {
  scopes: [`${backendAppIdUri}/.default`]
};

export const pca = new PublicClientApplication(msalConfig);

