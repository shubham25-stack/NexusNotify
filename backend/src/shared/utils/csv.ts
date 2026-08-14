import * as fs from "node:fs";
import * as path from "node:path";
import csv from "csv-parser";

const escapeCsvValue = (value: string): string => {
  if (/[",\n\r;]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
};

export const readCSV = <T = Record<string, string>>(
  filePath: string,
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const rows: T[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row as T))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
};

export const writeCSV = async (
  filePath: string,
  headers: string[],
  rows: Array<Record<string, string | number | null | undefined>>,
): Promise<void> => {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

  const serializedRows = rows.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        return escapeCsvValue(value == null ? "" : String(value));
      })
      .join(",");
  });

  const output = [headers.join(","), ...serializedRows].join("\n");
  await fs.promises.writeFile(filePath, `${output}\n`, "utf8");
};
