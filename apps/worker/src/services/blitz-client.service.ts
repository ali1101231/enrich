import { env } from "../lib/env.js";

export class BlitzClientService {
  async enrichRow(
    apiKeyValue: string,
    row: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    // Keep all external API calls centralized in this wrapper to support provider swaps later.
    if (env.BLITZ_API_BASE_URL.includes("blitz.example")) {
      return {
        ...row,
        _provider: "mock",
        _enrichedAt: new Date().toISOString(),
      };
    }

    const response = await fetch(`${env.BLITZ_API_BASE_URL}/enrich`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKeyValue}`,
      },
      body: JSON.stringify({ row }),
      signal: AbortSignal.timeout(env.BLITZ_API_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Blitz API error: ${response.status}`);
    }

    const result = (await response.json()) as Record<string, unknown>;
    return result;
  }
}
