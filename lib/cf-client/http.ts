/**
 * cf-client/http.ts
 *
 * Thin fetch wrapper around the Cloudflare API.
 * No business logic — just HTTP, retries, and error normalization.
 * Works in Node.js, CF Workers, and browser (fetch is universal).
 */

import type {
    CFClientConfig,
    CFHttpClient,
    CFResponse,
    CFResponseList,
    CFError,
  } from "./types"
  
  const CF_BASE_URL = "https://api.cloudflare.com/client/v4"
  
  // ── Error ─────────────────────────────────────────────────────────────────────
  
  export class CFApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly errors: CFError[],
    ) {
      super(message)
      this.name = "CFApiError"
    }
  
    static fromErrors(errors: CFError[], status: number): CFApiError {
      const message = errors.map((e) => `[${e.code}] ${e.message}`).join(", ")
      return new CFApiError(message, status, errors)
    }
  }
  
  // ── Client ────────────────────────────────────────────────────────────────────
  
  export function createCFClient(config: CFClientConfig): CFHttpClient {
    const base = config.baseUrl ?? CF_BASE_URL
    const maxRetries = config.maxRetries ?? 3
    const retryDelay = config.retryDelay ?? 500
  
    const headers = {
      "Authorization": `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
    }
  
    async function request<T>(
      method: string,
      path: string,
      body?: unknown,
      attempt = 1,
    ): Promise<T> {
      const url = `${base}${path}`
  
      const res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
  
      // retry on 429 or 5xx
      if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
        const delay = retryDelay * attempt
        await sleep(delay)
        return request<T>(method, path, body, attempt + 1)
      }
  
      const data = (await res.json()) as T & { success: boolean; errors: CFError[] }
  
      if (!data.success) {
        throw CFApiError.fromErrors(data.errors ?? [], res.status)
      }
  
      return data
    }
  
    return {
      get: <T>(path: string) =>
        request<CFResponse<T>>("GET", path),
  
      getList: <T>(path: string) =>
        request<CFResponseList<T>>("GET", path),
  
      post: <T>(path: string, body?: unknown) =>
        request<CFResponse<T>>("POST", path, body),
  
      put: <T>(path: string, body?: unknown) =>
        request<CFResponse<T>>("PUT", path, body),
  
      delete: <T>(path: string) =>
        request<CFResponse<T>>("DELETE", path),
    }
  }
  
  // ── Helpers ───────────────────────────────────────────────────────────────────
  
  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }