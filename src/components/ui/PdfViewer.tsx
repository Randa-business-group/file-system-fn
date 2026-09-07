"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCw,
  SearchX,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface PdfViewerProps {
  fileUrl: string;
  fileName: string;
  onDownload?: () => void;
  onError?: () => void;
}

export function isCloudinaryPdf(url: string): boolean {
  return /res\.cloudinary\.com/i.test(url) || /cloudinary\.com/i.test(url);
}

export function getCloudinaryPdfPageUrl(
  fileUrl: string,
  page: number,
  width = 1600,
): string {
  // Replace .pdf extension with .png
  let url = fileUrl.replace(/\.pdf(\?.*)?$/i, ".png$1");
  if (!url.includes(".png")) {
    const qIndex = url.indexOf("?");
    if (qIndex !== -1) {
      url = url.slice(0, qIndex) + ".png" + url.slice(qIndex);
    } else {
      url = url + ".png";
    }
  }

  // Ensure it uses /image/upload/
  url = url.replace("/raw/upload/", "/image/upload/");

  const uploadToken = "/image/upload/";
  const idx = url.indexOf(uploadToken);
  if (idx === -1) return url;

  const prefix = url.slice(0, idx + uploadToken.length);
  const rest = url.slice(idx + uploadToken.length);
  const slashIdx = rest.indexOf("/");

  if (slashIdx !== -1) {
    const seg = rest.slice(0, slashIdx);
    // If the segment is not a version string (e.g. v1788518462), it contains existing transformations
    if (!/^v\d+$/.test(seg)) {
      const cleaned = seg
        .split(",")
        .filter(
          (p) =>
            !p.startsWith("pg_") &&
            !p.startsWith("w_") &&
            !p.startsWith("c_") &&
            !p.startsWith("f_") &&
            !p.startsWith("q_"),
        )
        .join(",");
      const transform = [
        cleaned,
        "f_auto",
        "q_auto",
        `w_${width}`,
        "c_limit",
        `pg_${page}`,
      ]
        .filter(Boolean)
        .join(",");
      return prefix + transform + "/" + rest.slice(slashIdx + 1);
    }
  }

  return `${prefix}f_auto,q_auto,w_${width},c_limit,pg_${page}/${rest}`;
}

export function PdfViewer({
  fileUrl,
  fileName,
  onDownload,
  onError,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isCloudinary = isCloudinaryPdf(fileUrl);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageInputValue, setPageInputValue] = useState("1");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [useFallbackIframe, setUseFallbackIframe] = useState(false);

  // Probe Cloudinary total pages using HEAD request with pg_999999
  useEffect(() => {
    if (!isCloudinary) return;

    let cancelled = false;
    const probeUrl = getCloudinaryPdfPageUrl(fileUrl, 999999, 100);

    fetch(probeUrl, { method: "HEAD" })
      .then((res) => {
        if (cancelled) return;
        const errHeader = res.headers.get("x-cld-error");
        const match = errHeader?.match(/only has (\d+) pages/i);
        if (match) {
          const detected = parseInt(match[1], 10);
          if (!isNaN(detected) && detected > 0) {
            setTotalPages(detected);
          }
        }
      })
      .catch(() => {
        // Silently ignore probe errors; totalPages will be determined dynamically
      });

    return () => {
      cancelled = true;
    };
  }, [fileUrl, isCloudinary]);

  // Preload adjacent pages for Cloudinary PDFs
  useEffect(() => {
    if (!isCloudinary) return;

    if (totalPages === null || currentPage < totalPages) {
      const nextImg = new window.Image();
      nextImg.src = getCloudinaryPdfPageUrl(fileUrl, currentPage + 1, 1600);
    }
    if (currentPage > 1) {
      const prevImg = new window.Image();
      prevImg.src = getCloudinaryPdfPageUrl(fileUrl, currentPage - 1, 1600);
    }
  }, [currentPage, fileUrl, isCloudinary, totalPages]);

  // Non-Cloudinary: Attempt rendering via pdfjs-dist
  useEffect(() => {
    if (isCloudinary || useFallbackIframe) return;

    let cancelled = false;

    async function loadPdfJs() {
      try {
        setPageLoading(true);
        setRenderError(null);

        const pdfjsLib = (await import("@/lib/pdfjs-setup")).default;
        const loadingTask = pdfjsLib.getDocument({
          url: fileUrl,
          withCredentials: false,
        });
        const doc = await loadingTask.promise;

        if (cancelled) return;
        setTotalPages(doc.numPages);

        const page = await doc.getPage(currentPage);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const scale = (zoom / 100) * 1.5;
        const viewport = page.getViewport({ scale, rotation });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({
          canvasContext: ctx,
          viewport,
          canvas,
        }).promise;

        if (!cancelled) {
          setPageLoading(false);
        }
      } catch (err) {
        console.warn("PDF.js render failed, switching to fallback viewer:", err);
        if (!cancelled) {
          setUseFallbackIframe(true);
          setPageLoading(false);
        }
      }
    }

    loadPdfJs();

    return () => {
      cancelled = true;
    };
  }, [currentPage, fileUrl, isCloudinary, rotation, useFallbackIframe, zoom]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setPageLoading(true);
      setCurrentPage((p) => {
        const next = p - 1;
        setPageInputValue(String(next));
        return next;
      });
    }
  }, [currentPage]);

  const goToNextPage = useCallback(() => {
    if (totalPages === null || currentPage < totalPages) {
      setPageLoading(true);
      setCurrentPage((p) => {
        const next = p + 1;
        setPageInputValue(String(next));
        return next;
      });
    }
  }, [currentPage, totalPages]);

  const handlePageInputSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseInt(pageInputValue, 10);
    if (isNaN(parsed) || parsed < 1) {
      setPageInputValue(String(currentPage));
      return;
    }

    if (totalPages !== null && parsed > totalPages) {
      setCurrentPage(totalPages);
      setPageInputValue(String(totalPages));
      setPageLoading(true);
      return;
    }

    setCurrentPage(parsed);
    setPageLoading(true);
  };

  const handleZoomIn = () => {
    setZoom((z) => Math.min(250, z + 25));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(50, z - 25));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "TEXTAREA")
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        goToPrevPage();
      } else if (e.key === "ArrowRight") {
        goToNextPage();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        handleResetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextPage, goToPrevPage]);

  // Cloudinary image load error handler
  const handleCloudinaryError = () => {
    setPageLoading(false);
    if (currentPage > 1) {
      // Reached past the last page
      setTotalPages(currentPage - 1);
      setCurrentPage(currentPage - 1);
    } else {
      // First page failed to render
      setRenderError(
        "Unable to render this PDF file. You can download the file to view it locally.",
      );
      onError?.();
    }
  };

  const currentCloudinaryUrl = isCloudinary
    ? getCloudinaryPdfPageUrl(fileUrl, currentPage, 1800)
    : "";

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col overflow-hidden bg-gray-100 dark:bg-gray-900"
    >
      {/* ── PDF Slim Toolbar ── */}
      <div className="flex h-10 flex-shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 shadow-sm dark:border-gray-800 dark:bg-gray-800/80">
        {/* Left: Page Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            title="Previous page (Left arrow)"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <form
            onSubmit={handlePageInputSubmit}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
          >
            <span className="hidden sm:inline">Page</span>
            <input
              type="text"
              value={pageInputValue}
              onChange={(e) => setPageInputValue(e.target.value)}
              onBlur={() => handlePageInputSubmit()}
              aria-label="Current page number"
              className="h-6 w-10 rounded border border-gray-300 bg-white text-center text-xs font-medium text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <span>of {totalPages ?? "—"}</span>
          </form>

          <button
            type="button"
            onClick={goToNextPage}
            disabled={totalPages !== null && currentPage >= totalPages}
            title="Next page (Right arrow)"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Center: Quick Page Jumping (for multi-page) */}
        {totalPages !== null && totalPages > 1 && (
          <div className="hidden md:flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setPageLoading(true);
                setCurrentPage(1);
                setPageInputValue("1");
              }}
              disabled={currentPage === 1}
              className="rounded px-1.5 py-0.5 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              First
            </button>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <button
              type="button"
              onClick={() => {
                setPageLoading(true);
                setCurrentPage(totalPages);
                setPageInputValue(String(totalPages));
              }}
              disabled={currentPage === totalPages}
              className="rounded px-1.5 py-0.5 text-[11px] text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Last
            </button>
          </div>
        )}

        {/* Right: Zoom, Rotate, Fullscreen */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            title="Zoom out (-)"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset zoom to 100% (0)"
            className="h-7 min-w-[48px] rounded-lg px-1.5 text-center text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {zoom}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 250}
            title="Zoom in (+)"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>

          <div className="mx-1 h-4 w-[1px] bg-gray-200 dark:bg-gray-700" />

          <button
            type="button"
            onClick={handleRotate}
            title="Rotate 90° clockwise"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Main Canvas / Viewport Area ── */}
      <div className="relative flex-1 overflow-auto p-4 sm:p-6 select-none">
        {/* Loading Spinner */}
        {pageLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px] dark:bg-gray-900/60">
            <div className="flex flex-col items-center gap-2 rounded-xl bg-white/90 p-4 shadow-lg dark:bg-gray-800/90">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Loading page {currentPage}...
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {renderError ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-sm rounded-xl border border-gray-200 bg-white p-6 text-center shadow dark:border-gray-700 dark:bg-gray-800">
              <SearchX className="mx-auto mb-3 h-10 w-10 text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Preview unavailable
              </h4>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {renderError}
              </p>
              {onDownload && (
                <button
                  type="button"
                  onClick={onDownload}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-700"
                >
                  Download {fileName}
                </button>
              )}
            </div>
          </div>
        ) : isCloudinary ? (
          /* Cloudinary High-Res Page Renderer */
          <div className="flex min-h-full items-center justify-center">
            <div
              className="transition-transform duration-150 ease-out"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={`${fileUrl}_pg_${currentPage}`}
                src={currentCloudinaryUrl}
                alt={`Page ${currentPage} of ${fileName}`}
                className="max-h-[calc(100vh-10rem)] w-auto max-w-full rounded-md bg-white object-contain shadow-xl ring-1 ring-black/5 dark:ring-white/10"
                onLoad={() => setPageLoading(false)}
                onError={handleCloudinaryError}
                draggable={false}
              />
            </div>
          </div>
        ) : useFallbackIframe ? (
          /* Non-Cloudinary Iframe Fallback */
          <div className="h-full w-full overflow-hidden rounded-lg bg-white shadow-inner">
            <iframe
              src={fileUrl}
              className="h-full w-full border-none"
              title={fileName}
              onLoad={() => setPageLoading(false)}
              onError={() => {
                setPageLoading(false);
                setRenderError(
                  "Could not load PDF document inside browser frame.",
                );
              }}
            />
          </div>
        ) : (
          /* PDF.js Canvas Renderer */
          <div className="flex min-h-full items-center justify-center">
            <div
              className="transition-transform duration-150 ease-out"
              style={{
                transformOrigin: "center center",
              }}
            >
              <canvas
                ref={canvasRef}
                className="max-h-[calc(100vh-10rem)] w-auto max-w-full rounded-md bg-white shadow-xl ring-1 ring-black/5 dark:ring-white/10"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
