import { createWorker } from "tesseract.js";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import pdfjsLib from "./pdfjs-setup";
import { getUploadFileKind } from "./upload-file-types";

const extractTextFromImage = async (file: File): Promise<string> => {
  const worker = await createWorker("eng");
  const {
    data: { text },
  } = await worker.recognize(file);
  await worker.terminate();
  return text;
};

const extractTextFromPDF = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: canvas.getContext("2d")!,
    viewport,
    canvas,
  }).promise;

  return new Promise<string>((resolve) => {
    canvas.toBlob(async (blob) => {
      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(blob!);
      await worker.terminate();
      resolve(text);
    });
  });
};

export async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function extractTextFromExcel(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return "";
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  return rows
    .slice(0, 20)
    .map((row) =>
      Object.entries(row)
        .map(([column, value]) => `${column}: ${String(value)}`)
        .join(", "),
    )
    .join("\n");
}

export async function extractTextFromCSV(file: File): Promise<string> {
  const text = await file.text();
  return text.split(/\r?\n/).slice(0, 20).join("\n");
}

export async function extractTextFromFile(file: File): Promise<string> {
  const kind = getUploadFileKind(file);

  switch (kind) {
    case "pdf":
      return extractTextFromPDF(file);
    case "word":
      return extractTextFromDocx(file);
    case "excel":
      return extractTextFromExcel(file);
    case "csv":
      return extractTextFromCSV(file);
    case "image":
      return extractTextFromImage(file);
    default:
      throw new Error("Unsupported file type for text extraction.");
  }
}

/** @deprecated Use extractTextFromFile */
export const extractText = extractTextFromFile;
