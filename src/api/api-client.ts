import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import { messageFromErrorJson } from "@/types/http";
import type { JsonValue } from "@/types/json";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: JsonValue,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Nest global prefix is `api` -> e.g. `http://localhost:4000/api` + `/auth/login`. */
export const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"
).replace(/\/+$/, "");

const TOKEN_KEY = "tracker_token";
export const TOKEN_EVENT = "tracker:token-changed";

function notifyTokenChange(hasToken: boolean): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<boolean>(TOKEN_EVENT, { detail: hasToken }));
}

export const tokenStorage = {
  get: (): string | null =>
    typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
    notifyTokenChange(true);
  },
  remove: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    notifyTokenChange(false);
  },
};

export const httpClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5000000,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<JsonValue>) => {
    const status = error.response?.status ?? 500;
    const data = error.response?.data;
    const fallback = error.message || "Request failed";
    const message =
      data === undefined || data === null ? fallback : messageFromErrorJson(data) ?? fallback;
    return Promise.reject(new ApiError(status, message, data));
  },
);

type RequestConfig = Omit<AxiosRequestConfig, "url" | "method" | "data">;

export const apiClient = {
  async get<TResponse>(path: string, config?: RequestConfig): Promise<TResponse> {
    const response = await httpClient.get<TResponse>(path, config);
    return response.data;
  },

  async post<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    config?: RequestConfig,
  ): Promise<TResponse> {
    const response = await httpClient.post<TResponse>(path, body, config);
    return response.data;
  },

  async put<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    config?: RequestConfig,
  ): Promise<TResponse> {
    const response = await httpClient.put<TResponse>(path, body, config);
    return response.data;
  },

  async patch<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    config?: RequestConfig,
  ): Promise<TResponse> {
    const response = await httpClient.patch<TResponse>(path, body, config);
    return response.data;
  },

  async delete<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    config?: RequestConfig,
  ): Promise<TResponse> {
    const response = await httpClient.delete<TResponse>(path, { data: body, ...config });
    return response.data;
  },

  async postFormData<TResponse>(
    path: string,
    formData: FormData,
    config?: RequestConfig,
  ): Promise<TResponse> {
    const response = await httpClient.post<TResponse>(path, formData, {
      ...config,
      headers: {
        ...(config?.headers ?? {}),
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
