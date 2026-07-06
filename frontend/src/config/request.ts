import axios, { AxiosRequestConfig } from "axios";
import { addSeconds, formatISO } from "date-fns";

import { createNotification } from "@app/components/notifications";
import SecurityClient from "@app/components/utilities/SecurityClient";
import { envConfig } from "@app/config/env";
import { SessionStorageKeys } from "@app/const";
import { fetchAuthToken } from "@app/hooks/api/auth/refresh";
import {
  getAuthToken,
  getMfaTempToken,
  getSignupTempToken,
  setAuthToken
} from "@app/hooks/api/reactQuery";

// Defaults to "/" so the SPA hits the API on its own origin (single-image
// STANDALONE_MODE deploy + dev proxy). Set VITE_API_URL to point at a backend
// on a different origin when the frontend is deployed as a standalone service.
export const apiRequest = axios.create({
  baseURL: envConfig.API_URL || "/",
  // Send the httpOnly auth cookie on cross-origin requests too, so login /
  // session refresh work when the frontend is served from a different origin
  // than the backend. Harmless in the same-origin (combined) deploy.
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

apiRequest.interceptors.request.use((config) => {
  // Skip auto-injection if the caller already set an Authorization header
  if (config.headers?.Authorization) return config;

  const signupTempToken = getSignupTempToken();
  const mfaTempToken = getMfaTempToken();
  const token = getAuthToken();

  if (config.headers) {
    if (mfaTempToken) {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${mfaTempToken}`;
    } else if (token) {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${token}`;
    } else if (signupTempToken) {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${signupTempToken}`;
    }
  }

  return config;
});

let isRedirecting = false;

const resetRedirectingFlag = () => {
  isRedirecting = false;
};

let refreshPromise: Promise<string> | null = null;

const isTokenExpiredError = (message: string) => {
  const lower = message.toLowerCase();
  return lower.includes("token expired") || lower.includes("stalesession");
};

apiRequest.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    if (
      response &&
      response.status === 401 &&
      isTokenExpiredError(response.data?.message || "") &&
      getAuthToken() &&
      !(config as AxiosRequestConfig & { infisicalRetry?: boolean }).infisicalRetry
    ) {
      (config as AxiosRequestConfig & { infisicalRetry?: boolean }).infisicalRetry = true;

      try {
        // Deduplicate concurrent refresh attempts
        if (!refreshPromise) {
          refreshPromise = fetchAuthToken()
            .then((data) => data.token)
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newToken = await refreshPromise;

        // Retry the original request with the new token
        // eslint-disable-next-line no-param-reassign
        config.headers.Authorization = `Bearer ${newToken}`;
        return await apiRequest(config);
      } catch {
        // Refresh failed — clear session and redirect to login
        if (!isRedirecting) {
          isRedirecting = true;

          try {
            setAuthToken("");
            SecurityClient.setToken("");
          } catch (err) {
            console.warn("Error clearing tokens:", err);
          }

          createNotification({
            type: "error",
            title: "Session Expired",
            text: "Your session has expired. Redirecting to login page..."
          });

          try {
            sessionStorage.setItem(
              SessionStorageKeys.ORG_LOGIN_SUCCESS_REDIRECT_URL,
              JSON.stringify({
                expiry: formatISO(addSeconds(new Date(), 300)),
                data: window.location.href
              })
            );
          } catch (err) {
            console.warn("Could not save redirect URL to sessionStorage:", err);
          }

          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);

          setTimeout(resetRedirectingFlag, 3000);

          return Promise.reject(new Error("Session expired - redirecting to login"));
        }
      }
    }

    return Promise.reject(error);
  }
);
