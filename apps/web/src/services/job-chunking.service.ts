import { chunkArray } from "@koldify/shared";
import type { ParsedRow } from "./csv-parser.service.js";

export interface ChunkedJobDraft {
  sequence: number;
  rowCount: number;
  payload: {
    rows: ParsedRow[];
  };
}

export class JobChunkingService {
  chunkRows(rows: ParsedRow[], chunkSize: number): ChunkedJobDraft[] {
    const safeChunkSize = Math.max(1, chunkSize);
    return chunkArray(rows, safeChunkSize).map((chunk: ParsedRow[], index: number) => ({
      sequence: index,
      rowCount: chunk.length,
      payload: {
        rows: chunk,
      },
    }));
  }
}
