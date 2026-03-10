import { BLITZ_TOOL_IDS } from "@koldify/shared";

export interface BlitzEndpointConfig {
  /** Blitz API path, e.g. "/v2/enrichment/email" */
  path: string;
  /** Aliases for the required input field */
  requiredAliases: string[];
  /** Build the request body from a CSV row */
  buildPayload: (row: Record<string, string>) => Record<string, string>;
  /** Merge original row + Blitz response into the final result */
  normalizeResponse: (
    input: Record<string, string>,
    response: Record<string, unknown>,
  ) => Record<string, unknown>;
}

export class BlitzInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlitzInputError";
  }
}

// ---- Input field resolution ----

const PERSON_LINKEDIN_ALIASES = [
  "person_linkedin_url",
  "linkedin_url",
  "linkedin",
  "profile_url",
  "url",
  "person_url",
];

const COMPANY_LINKEDIN_ALIASES = [
  "company_linkedin_url",
  "company_url",
  "company_linkedin",
  "linkedin_url",
  "url",
];

const DOMAIN_ALIASES = [
  "domain",
  "website",
  "company_domain",
  "url",
  "company_website",
];

function resolveField(
  row: Record<string, string>,
  aliases: string[],
): string {
  for (const alias of aliases) {
    const key = Object.keys(row).find(
      (k) => k.toLowerCase().trim() === alias.toLowerCase(),
    );
    if (key && row[key]?.trim()) {
      return row[key].trim();
    }
  }
  throw new BlitzInputError(
    `Missing required input column. Expected one of: ${aliases.join(", ")}`,
  );
}

/**
 * Check whether a row has the required input field for a tool.
 * Returns null if valid, or a human-readable reason if the row should be skipped.
 */
function checkField(
  row: Record<string, string>,
  aliases: string[],
): string | null {
  for (const alias of aliases) {
    const key = Object.keys(row).find(
      (k) => k.toLowerCase().trim() === alias.toLowerCase(),
    );
    if (key && row[key]?.trim()) {
      return null; // valid
    }
  }
  return `Missing required input. Expected one of: ${aliases.join(", ")}`;
}

// ---- Response helpers ----

function flattenObject(
  obj: Record<string, unknown>,
  prefix: string,
): Record<string, unknown> {
  const flat: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(
        flat,
        flattenObject(value as Record<string, unknown>, `${prefix}${key}_`),
      );
    } else {
      flat[`${prefix}${key}`] = value;
    }
  }
  return flat;
}

// ---- Endpoint definitions ----

const emailEnricher: BlitzEndpointConfig = {
  path: "/v2/enrichment/email",
  requiredAliases: PERSON_LINKEDIN_ALIASES,
  buildPayload: (row) => ({
    person_linkedin_url: resolveField(row, PERSON_LINKEDIN_ALIASES),
  }),
  normalizeResponse: (input, response) => ({
    ...input,
    _found: String(response.found ?? false),
    _email: (response.email as string) ?? "",
    _all_emails: response.all_emails
      ? JSON.stringify(response.all_emails)
      : "",
  }),
};

const phoneEnricher: BlitzEndpointConfig = {
  path: "/v2/enrichment/phone",
  requiredAliases: PERSON_LINKEDIN_ALIASES,
  buildPayload: (row) => ({
    person_linkedin_url: resolveField(row, PERSON_LINKEDIN_ALIASES),
  }),
  normalizeResponse: (input, response) => ({
    ...input,
    _found: String(response.found ?? false),
    _phone: (response.phone as string) ?? "",
  }),
};

const companyEnricher: BlitzEndpointConfig = {
  path: "/v2/enrichment/company",
  requiredAliases: COMPANY_LINKEDIN_ALIASES,
  buildPayload: (row) => ({
    company_linkedin_url: resolveField(row, COMPANY_LINKEDIN_ALIASES),
  }),
  normalizeResponse: (input, response) => {
    const base: Record<string, unknown> = {
      ...input,
      _found: String(response.found ?? false),
    };
    if (
      response.found &&
      response.company &&
      typeof response.company === "object"
    ) {
      Object.assign(
        base,
        flattenObject(response.company as Record<string, unknown>, "company_"),
      );
    }
    return base;
  },
};

const domainToLinkedin: BlitzEndpointConfig = {
  path: "/v2/enrichment/domain-to-linkedin",
  requiredAliases: DOMAIN_ALIASES,
  buildPayload: (row) => ({
    domain: resolveField(row, DOMAIN_ALIASES),
  }),
  normalizeResponse: (input, response) => ({
    ...input,
    _found: String(response.found ?? false),
    _company_linkedin_url: (response.company_linkedin_url as string) ?? "",
  }),
};

// ---- Registry (supports shared-constant IDs and frontend IDs) ----

const ENDPOINT_REGISTRY: Record<string, BlitzEndpointConfig> = {
  [BLITZ_TOOL_IDS.emailEnricher]: emailEnricher,
  [BLITZ_TOOL_IDS.phoneEnricher]: phoneEnricher,
  [BLITZ_TOOL_IDS.companyEnricher]: companyEnricher,
  [BLITZ_TOOL_IDS.domainToLinkedin]: domainToLinkedin,
};

export function getEndpointConfig(
  toolId: string,
): BlitzEndpointConfig | null {
  return ENDPOINT_REGISTRY[toolId] ?? null;
}

export function isSupportedBlitzTool(toolId: string): boolean {
  return toolId in ENDPOINT_REGISTRY;
}

/**
 * Pre-validate a row before sending to Blitz.
 * Returns null if the row has valid input, or a skip reason string if it should be skipped.
 */
export function validateRow(toolId: string, row: Record<string, string>): string | null {
  const config = ENDPOINT_REGISTRY[toolId];
  if (!config) return null;
  return checkField(row, config.requiredAliases);
}
