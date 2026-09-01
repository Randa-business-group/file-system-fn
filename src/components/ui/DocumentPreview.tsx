"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  SearchX,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { renderAsync } from "docx-preview";
import * as XLSX from "xlsx";
import { getDocumentFileMeta } from "@/lib/upload-file-types";

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: string;
}

type PreviewFileType = "pdf" | "docx" | "xlsx" | "csv" | "image" | "unknown";

function getFileType(fileName: string): PreviewFileType {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  switch (extension) {
    case "pdf":
      return "pdf";
    case "docx":
      return "docx";
    case "xlsx":
    case "xls":
      return "xlsx";
    case "csv":
      return "csv";
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
      return "image";
    default:
      return "unknown";
  }
}

const LOADING_MESSAGES: Record<PreviewFileType, string> = {
  pdf: "Loading document...",
  docx: "Rendering Word document...",
  xlsx: "Loading spreadsheet...",
  csv: "Loading data...",
  image: "Loading image...",
  unknown: "Loading...",
};

function getPreviewMeta(fileName: string, fileType: string) {
  const meta = getDocumentFileMeta(fileName, fileType);
  const previewType = getFileType(fileName);

  return {
    fileType: previewType,
    label: meta.typeLabel,
    iconSrc: meta.iconSrc,
    iconBg: meta.badgeClassName,
  };
}

function applySpreadsheetTableStyles(table: HTMLTableElement) {
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";

  const rows = table.querySelectorAll("tr");
  rows.forEach((row, rowIndex) => {
    const cells = row.querySelectorAll("th, td");
    cells.forEach((cell) => {
      const htmlCell = cell as HTMLElement;
      htmlCell.style.padding = "8px 12px";
      htmlCell.style.border = "1px solid #e5e7eb";
    });

    if (rowIndex === 0) {
      cells.forEach((cell) => {
        const htmlCell = cell as HTMLElement;
        htmlCell.style.background = "#14532d";
        htmlCell.style.color = "white";
        htmlCell.style.fontWeight = "bold";
        htmlCell.style.position = "sticky";
        htmlCell.style.top = "0";
        htmlCell.style.zIndex = "1";
      });
      return;
    }

    const background = (rowIndex - 1) % 2 === 0 ? "#ffffff" : "#f9fafb";
    cells.forEach((cell) => {
      (cell as HTMLElement).style.background = background;
    });
  });
}

function parseCsvRows(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rowsToHtmlTable(rows: string[][]): string {
  if (rows.length === 0) {
    return "<table><tbody><tr><td>No data</td></tr></tbody></table>";
  }

  const [header, ...body] = rows;
  const headerHtml = header
    .map((cell) => `<th>${escapeHtml(cell)}</th>`)
    .join("");
  const bodyHtml = body
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
    )
    .join("");

  return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
}

export function DocumentPreview({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType,
}: DocumentPreviewProps) {
  const portalTarget =
    typeof window !== "undefined" ? window.document.body : null;

  const previewMeta = useMemo(
    () => getPreviewMeta(fileName, fileType),
    [fileName, fileType],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    window.document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleDownload = () => {
    const link = window.document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  if (!isOpen || !portalTarget || !fileUrl) return null;

  return createPortal(
    <PreviewContent
      key={`${fileUrl}:${fileType}:${fileName}`}
      fileUrl={fileUrl}
      fileName={fileName}
      previewMeta={previewMeta}
      onClose={onClose}
      onDownload={handleDownload}
    />,
    portalTarget,
  );
}

interface PreviewContentProps {
  fileUrl: string;
  fileName: string;
  previewMeta: ReturnType<typeof getPreviewMeta>;
  onClose: () => void;
  onDownload: () => void;
}

function PreviewContent({
  fileUrl,
  fileName,
  previewMeta,
  onClose,
  onDownload,
}: PreviewContentProps) {
  const previewType = previewMeta.fileType;
  const needsFetchLoading = previewType === "docx" || previewType === "xlsx" || previewType === "csv";
  const needsMediaLoading = previewType === "pdf" || previewType === "image";

  const [isLoading, setIsLoading] = useState(needsFetchLoading || needsMediaLoading);
  const [isZoomed, setIsZoomed] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  const docxContainerRef = useRef<HTMLDivElement>(null);
  const spreadsheetTableRef = useRef<HTMLDivElement>(null);

  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [csvTableHtml, setCsvTableHtml] = useState("");

  useEffect(() => {
    if (previewType !== "docx") return;

    const container = docxContainerRef.current;
    if (!container) return;

    let cancelled = false;
    setIsLoading(true);
    setPreviewFailed(false);
    container.innerHTML = "";

    fetch(fileUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch document");
        }
        return response.arrayBuffer();
      })
      .then((buffer) => renderAsync(buffer, container))
      .then(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoading(false);
          setPreviewFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fileUrl, previewType]);

  useEffect(() => {
    if (previewType !== "xlsx") return;

    let cancelled = false;
    setIsLoading(true);
    setPreviewFailed(false);
    setWorkbook(null);
    setSheetNames([]);
    setActiveSheet("");

    fetch(fileUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch spreadsheet");
        }
        return response.arrayBuffer();
      })
      .then((buffer) => {
        const parsedWorkbook = XLSX.read(buffer);
        if (cancelled) return;

        setWorkbook(parsedWorkbook);
        setSheetNames(parsedWorkbook.SheetNames);
        setActiveSheet(parsedWorkbook.SheetNames[0] ?? "");
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoading(false);
          setPreviewFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fileUrl, previewType]);

  useEffect(() => {
    if (previewType !== "csv") return;

    let cancelled = false;
    setIsLoading(true);
    setPreviewFailed(false);
    setCsvTableHtml("");

    fetch(fileUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch CSV");
        }
        return response.text();
      })
      .then((text) => {
        if (cancelled) return;
        setCsvTableHtml(rowsToHtmlTable(parseCsvRows(text)));
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoading(false);
          setPreviewFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fileUrl, previewType]);

  const spreadsheetHtml = useMemo(() => {
    if (previewType !== "xlsx" || !workbook || !activeSheet) {
      return "";
    }

    const sheet = workbook.Sheets[activeSheet];
    if (!sheet) return "";

    return XLSX.utils.sheet_to_html(sheet);
  }, [activeSheet, previewType, workbook]);

  useEffect(() => {
    if (previewType !== "xlsx" && previewType !== "csv") return;

    const wrapper = spreadsheetTableRef.current;
    if (!wrapper) return;

    const table = wrapper.querySelector("table");
    if (!table) return;

    applySpreadsheetTableStyles(table);
  }, [csvTableHtml, previewType, spreadsheetHtml]);

  const loadingMessage = LOADING_MESSAGES[previewType];

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close document preview"
        className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <section className="fixed inset-x-3 top-3 z-[121] flex h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:inset-x-6 sm:top-6 sm:h-[calc(100vh-3rem)] lg:inset-x-10 dark:border-gray-700 dark:bg-gray-900">
        {/* ── Compact header ── */}
        <div className="flex h-12 flex-shrink-0 items-center gap-3 border-b border-gray-100 bg-gray-50 px-3 dark:border-gray-800 dark:bg-gray-800/60">
          {/* File type badge */}
          <div className="relative h-7 w-7 flex-shrink-0">
            <Image
              src={previewMeta.iconSrc}
              alt=""
              width={28}
              height={28}
              className="h-full w-full object-contain"
              draggable={false}
            />
          </div>

          {/* File name + meta */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-none text-gray-900 dark:text-gray-100">
              {fileName}
            </p>
            <p className="mt-0.5 text-[11px] leading-none text-gray-400 dark:text-gray-500">
              {previewMeta.label} · preview
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-shrink-0 items-center gap-1.5">
            {previewType === "image" && !previewFailed && (
              <button
                type="button"
                onClick={() => setIsZoomed((z) => !z)}
                title={isZoomed ? "Zoom out" : "Zoom in"}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                {isZoomed ? (
                  <ZoomOut className="h-4 w-4" />
                ) : (
                  <ZoomIn className="h-4 w-4" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onDownload}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12px] font-medium text-white transition hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Preview body — takes all remaining height ── */}
        <div className="relative flex flex-1 overflow-hidden">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-700 dark:border-gray-700 dark:border-t-gray-300" />
                <p className="text-xs text-gray-400">{loadingMessage}</p>
              </div>
            </div>
          )}

          {/* ── PDF ── */}
          {previewType === "pdf" && !previewFailed && (
            <div className="flex flex-1 overflow-hidden">
              {/* Main viewer column */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Inner toolbar */}
                <PdfInnerToolbar />

                {/* iframe fills the rest */}
                <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <iframe
                    src={fileUrl}
                    className="h-full w-full border-none bg-white"
                    title={fileName}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      setPreviewFailed(true);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Image ── */}
          {previewType === "image" && !previewFailed && (
            <div className="flex flex-1 items-center justify-center overflow-auto bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] dark:bg-[repeating-conic-gradient(#374151_0%_25%,transparent_0%_50%)]">
              <div
                className={[
                  "relative overflow-hidden rounded-lg shadow-lg transition-transform duration-200",
                  isZoomed ? "scale-[1.5]" : "scale-100",
                ].join(" ")}
                style={{ maxWidth: "90%", maxHeight: "90%" }}
              >
                <Image
                  src={fileUrl}
                  alt={fileName}
                  width={1200}
                  height={900}
                  unoptimized
                  className="block max-h-[calc(100vh-8rem)] w-auto object-contain"
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    setPreviewFailed(true);
                  }}
                />
              </div>
            </div>
          )}

          {/* ── DOCX ── */}
          {previewType === "docx" && !previewFailed && (
            <div className="flex flex-1 overflow-auto bg-gray-100 p-4 dark:bg-gray-800">
              <div
                ref={docxContainerRef}
                className="mx-auto w-full max-w-4xl bg-white p-8 shadow-sm"
                style={{ maxHeight: "80vh", overflowY: "auto" }}
              />
            </div>
          )}

          {/* ── XLSX ── */}
          {previewType === "xlsx" && !previewFailed && (
            <div className="flex flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
              {sheetNames.length > 1 ? (
                <div className="flex flex-shrink-0 gap-1 overflow-x-auto border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                  {sheetNames.map((sheetName) => (
                    <button
                      key={sheetName}
                      type="button"
                      onClick={() => setActiveSheet(sheetName)}
                      className={[
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                        activeSheet === sheetName
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600",
                      ].join(" ")}
                    >
                      {sheetName}
                    </button>
                  ))}
                </div>
              ) : null}

              <div
                className="flex-1 overflow-auto p-4"
                style={{ overflowX: "auto" }}
              >
                <div
                  ref={spreadsheetTableRef}
                  dangerouslySetInnerHTML={{ __html: spreadsheetHtml }}
                />
              </div>
            </div>
          )}

          {/* ── CSV ── */}
          {previewType === "csv" && !previewFailed && (
            <div
              className="flex flex-1 overflow-auto bg-gray-50 p-4 dark:bg-gray-900"
              style={{ overflowX: "auto" }}
            >
              <div
                ref={spreadsheetTableRef}
                dangerouslySetInnerHTML={{ __html: csvTableHtml }}
              />
            </div>
          )}

          {/* ── Unsupported / failed ── */}
          {(previewType === "unknown" || previewFailed) && (
            <div className="flex flex-1 items-center justify-center">
              <div className="max-w-sm rounded-2xl border border-gray-100 bg-white px-8 py-10 text-center shadow dark:border-gray-800 dark:bg-gray-800">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center">
                  {previewFailed ? (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                      <SearchX className="h-6 w-6 text-gray-400" />
                    </div>
                  ) : (
                    <Image
                      src={previewMeta.iconSrc}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 object-contain"
                      draggable={false}
                    />
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {previewFailed ? "Preview unavailable" : fileName}
                </h3>
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  {previewFailed
                    ? "We couldn't load this preview. Download the file to open it locally."
                    : "This file type cannot be previewed."}
                </p>
                {!previewFailed ? (
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Click Download to open it locally.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={onDownload}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download file
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}


/** Slim toolbar inside the PDF viewer column */
function PdfInnerToolbar() {
  return (
    <div className="flex h-9 flex-shrink-0 items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-3 dark:border-gray-800 dark:bg-gray-800/40">
      <button
        type="button"
        title="Previous page"
        className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Next page"
        className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <span className="flex-1 text-center text-[11px] text-gray-400 dark:text-gray-500">
        Page 1 of 12
      </span>

      <button
        type="button"
        title="Zoom out"
        className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
      >
        <ZoomOut className="h-3.5 w-3.5" />
      </button>
      <span className="w-9 text-center text-[11px] text-gray-400 dark:text-gray-500">
        100%
      </span>
      <button
        type="button"
        title="Zoom in"
        className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
      >
        <ZoomIn className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        title="Fullscreen"
        className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
