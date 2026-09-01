"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
import { getDocumentFileMeta } from "@/lib/upload-file-types";

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: string;
}

function getPreviewMeta(fileName: string, fileType: string) {
  const meta = getDocumentFileMeta(fileName, fileType);

  return {
    kind:
      meta.kind === "pdf"
        ? ("pdf" as const)
        : meta.kind === "image"
          ? ("image" as const)
          : ("other" as const),
    label: meta.typeLabel,
    iconSrc: meta.iconSrc,
    iconBg: meta.badgeClassName,
  };
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
  const [isLoading, setIsLoading] = useState(previewMeta.kind !== "other");
  const [isZoomed, setIsZoomed] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

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
            {previewMeta.kind === "image" && !previewFailed && (
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
                <p className="text-xs text-gray-400">Loading…</p>
              </div>
            </div>
          )}

          {/* ── PDF ── */}
          {previewMeta.kind === "pdf" && !previewFailed && (
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
          {previewMeta.kind === "image" && !previewFailed && (
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

          {/* ── Unsupported / failed ── */}
          {(previewMeta.kind === "other" || previewFailed) && (
            <div className="flex flex-1 items-center justify-center">
              <div className="max-w-sm rounded-2xl border border-gray-100 bg-white px-8 py-10 text-center shadow dark:border-gray-800 dark:bg-gray-800">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                  <SearchX className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Preview unavailable
                </h3>
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  This file type can&apos;t be rendered here. Download it to open
                  locally.
                </p>
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
