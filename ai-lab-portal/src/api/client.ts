import axios from "axios";
import { AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { loginRequest } from "../auth/msalConfig";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:7071/api";

if (!API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn("[API] VITE_API_BASE_URL not set; falling back to http://localhost:7071/api");
}

async function getAccessToken(instance: IPublicClientApplication, account: AccountInfo): Promise<string> {
  const result = await instance.acquireTokenSilent({
    ...loginRequest,
    account
  });

  return result.accessToken;
}

export async function apiGet<T>(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string
): Promise<T> {
  const token = await getAccessToken(instance, account);
  const res = await axios.get<T>(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
}

export async function apiPost<T>(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string,
  body?: unknown
): Promise<T> {
  const token = await getAccessToken(instance, account);
  const res = await axios.post<T>(`${API_BASE_URL}${path}`, body, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
}

export async function apiDelete<T>(
  instance: IPublicClientApplication,
  account: AccountInfo,
  path: string
): Promise<T> {
  const token = await getAccessToken(instance, account);
  const res = await axios.delete<T>(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
}


