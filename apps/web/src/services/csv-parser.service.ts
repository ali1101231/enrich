import { parse } from "csv-parse/sync";

export type ParsedRow = Record<string, string>;

export class CsvParserService {
  parseUploadedCsv(csvBuffer: Buffer): ParsedRow[] {
    const csvText = csvBuffer.toString("utf-8");
    return this.parseCsvText(csvText);
  }

  parsePastedRows(rowsText: string): ParsedRow[] {
    return this.parseCsvText(rowsText);
  }

  private parseCsvText(csvText: string): ParsedRow[] {
    const trimmed = csvText.trim();
    if (!trimmed) {
      return [];
    }

    const records = parse(trimmed, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    }) as ParsedRow[];

    return records.map((record) => {
      const normalized: ParsedRow = {};
      for (const [key, value] of Object.entries(record)) {
        normalized[key] = String(value ?? "").trim();
      }
      return normalized;
    });
  }
}
