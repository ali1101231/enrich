import { PROCESSING_QUEUE_NAME } from "@koldify/shared";
import { Queue } from "bullmq";
import { getBullConnection } from "../lib/bull-connection.js";
import { env } from "../lib/env.js";

export const processingQueue = new Queue(PROCESSING_QUEUE_NAME, {
  connection: getBullConnection(),
  prefix: env.BULLMQ_PREFIX,
});
