import axios, { AxiosError, type AxiosInstance } from "axios";
import { env } from "../lib/env.js";
import { logInfo, logWarn, logError } from "../lib/logger.js";
import {
  getEndpointConfig,
  BlitzInputError,
} from "./blitz-endpoint-map.js";

/** Permanent error — row should be marked as FAILURE, do not retry */
export class BlitzPermanentError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "BlitzPermanentError";
  }
}

/** Transient error — throw to let BullMQ retry the job */
export class BlitzTransientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "BlitzTransientError";
  }
}

export class BlitzClientService {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.BLITZ_API_BASE_URL,
      timeout: env.BLITZ_API_TIMEOUT_MS,
      headers: { "Content-Type": "application/json" },
    });
  }

  async enrichRow(
    apiKey: string,
    toolId: string,
    row: Record<string, string>,
  ): Promise<Record<string, unknown>> {
    const config = getEndpointConfig(toolId);
    if (!config) {
      throw new BlitzPermanentError(`Unsupported tool: ${toolId}`);
    }

    let payload: Record<string, string>;
    try {
      payload = config.buildPayload(row);
    } catch (err) {
      if (err instanceof BlitzInputError) {
        throw new BlitzPermanentError(err.message);
      }
      throw err;
    }

    const startMs = Date.now();

    try {
      logInfo("Blitz API request", {
        toolId,
        endpoint: config.path,
      });

      const response = await this.client.post(config.path, payload, {
        headers: { "x-api-key": apiKey },
      });

      const durationMs = Date.now() - startMs;
      logInfo("Blitz API response", {
        toolId,
        endpoint: config.path,
        status: response.status,
        durationMs,
        found: response.data?.found ?? null,
      });

      return config.normalizeResponse(row, response.data);
    } catch (err) {
      const durationMs = Date.now() - startMs;

      if (err instanceof AxiosError) {
        const status = err.response?.status;
        const body = err.response?.data as Record<string, unknown> | undefined;

        logWarn("Blitz API error", {
          toolId,
          endpoint: config.path,
          status: status ?? null,
          durationMs,
          message:
            typeof body?.message === "string" ? body.message : err.message,
        });

        if (status === 400 || status === 422) {
          throw new BlitzPermanentError(
            `Blitz validation error (${status}): ${typeof body?.message === "string" ? body.message : err.message}`,
            status,
          );
        }

        // Auth errors — fail the whole job (key is bad)
        if (status === 401 || status === 403) {
          throw new BlitzTransientError(
            `Blitz auth error (${status}): invalid or expired API key`,
            status,
          );
        }

        // Rate limit or server errors — transient, retry via BullMQ
        if (status === 429 || (status && status >= 500)) {
          throw new BlitzTransientError(
            `Blitz server error (${status})`,
            status,
          );
        }

        throw new BlitzTransientError(
          `Blitz request failed: ${err.message}`,
          status,
        );
      }

      logError("Blitz API network error", {
        toolId,
        endpoint: config.path,
        durationMs,
        message: err instanceof Error ? err.message : "unknown",
      });

      throw new BlitzTransientError(
        err instanceof Error ? err.message : "Unknown network error",
      );
    }
  }
}
