export const MAX_USERS_PER_API_KEY = 20;
export const API_KEY_REQUESTS_PER_SECOND = 5;
export const DEFAULT_CHUNK_SIZE = 10;
export const DEFAULT_PER_USER_ACTIVE_JOB_LIMIT = 2;
export const PROCESSING_QUEUE_NAME = "blitz-processing";

export const BLITZ_TOOL_IDS = {
	emailEnricher: "blitz-email-enricher",
	phoneEnricher: "blitz-phone-enricher",
	companyEnricher: "blitz-company-enricher",
	domainToLinkedin: "blitz-domain-to-linkedin",
} as const;
