import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

export type OutputFormat = "text" | "pdf" | "xlsx" | "image";

export interface GeneratedFile {
  format: OutputFormat;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export function generatePdf(title: string, bodyText: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).font("Helvetica-Bold").text(title, { align: "left" });
    doc.moveDown(1);
    doc.fontSize(11).font("Helvetica");

    const lines = bodyText.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("### ")) {
        doc.moveDown(0.5).fontSize(13).font("Helvetica-Bold").text(trimmed.slice(4));
        doc.fontSize(11).font("Helvetica");
      } else if (trimmed.startsWith("## ")) {
        doc.moveDown(0.5).fontSize(15).font("Helvetica-Bold").text(trimmed.slice(3));
        doc.fontSize(11).font("Helvetica");
      } else if (trimmed.startsWith("# ")) {
        doc.moveDown(0.5).fontSize(17).font("Helvetica-Bold").text(trimmed.slice(2));
        doc.fontSize(11).font("Helvetica");
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        doc.text(`•  ${trimmed.slice(2)}`, { indent: 15 });
      } else if (trimmed === "") {
        doc.moveDown(0.5);
      } else {
        doc.text(trimmed);
      }
    }

    doc.end();
  });
}

export interface TableData {
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
}

export async function generateXlsx(tables: TableData[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "WhyOr Dispatch";
  workbook.created = new Date();

  for (const table of tables) {
    const sheet = workbook.addWorksheet(table.sheetName.slice(0, 31));
    sheet.addRow(table.headers);
    sheet.getRow(1).font = { bold: true };
    for (const row of table.rows) sheet.addRow(row);
    table.headers.forEach((header, idx) => {
      const maxContentLength = Math.max(header.length, ...table.rows.map((r) => String(r[idx] ?? "").length));
      sheet.getColumn(idx + 1).width = Math.max(12, maxContentLength + 2);
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export function extractMarkdownTables(markdown: string, sheetNamePrefix = "Sheet"): TableData[] {
  const lines = markdown.split("\n");
  const tables: TableData[] = [];
  let i = 0;
  let sheetIndex = 1;

  while (i < lines.length) {
    const line = lines[i].trim();
    const isPipeRow = line.startsWith("|") && line.endsWith("|");
    const nextLine = lines[i + 1]?.trim() ?? "";
    const isSeparatorNext = /^\|?[\s:|-]+\|?$/.test(nextLine) && nextLine.includes("-");

    if (isPipeRow && isSeparatorNext) {
      const headers = splitPipeRow(line);
      const rows: (string | number)[][] = [];
      let j = i + 2;
      while (j < lines.length && lines[j].trim().startsWith("|")) {
        rows.push(splitPipeRow(lines[j].trim()).map(coerceNumberIfNumeric));
        j++;
      }
      tables.push({ sheetName: `${sheetNamePrefix}${tables.length > 0 ? sheetIndex : ""}`, headers, rows });
      sheetIndex++;
      i = j;
    } else {
      i++;
    }
  }
  return tables;
}

function splitPipeRow(row: string): string[] {
  return row.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

function coerceNumberIfNumeric(cell: string): string | number {
  const n = Number(cell.replace(/,/g, ""));
  return cell.trim() !== "" && !isNaN(n) ? n : cell;
}

export interface ImageGenerationResult {
  buffer: Buffer;
  mimeType: string;
  provider: string;
}

export async function generateImageViaProvider(
  prompt: string,
  provider: "openai" | "google",
  apiKey: string
): Promise<ImageGenerationResult> {
  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: "1024x1024", response_format: "b64_json" }),
    });
    if (!res.ok) throw new Error(`OpenAI image generation failed (${res.status}): ${await res.text()}`);
    const data: any = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI image generation returned no image data.");
    return { buffer: Buffer.from(b64, "base64"), mimeType: "image/png", provider: "openai" };
  }

  if (provider === "google") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1 } }),
      }
    );
    if (!res.ok) {
      // Fallback try with imagen-3.0-generate-001 or standard endpoint
      throw new Error(`Gemini image generation failed (${res.status}): ${await res.text()}`);
    }
    const data: any = await res.json();
    const b64 = data.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) throw new Error("Gemini image generation returned no image data.");
    return { buffer: Buffer.from(b64, "base64"), mimeType: "image/png", provider: "google" };
  }

  throw new Error(`No image generation support for provider '${provider}'.`);
}
