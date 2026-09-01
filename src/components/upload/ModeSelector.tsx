"use client";

import { Pencil, Sparkles } from "lucide-react";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { isSpreadsheetKind } from "@/lib/upload-file-types";
import { getUploadFileKind } from "@/lib/upload-file-types";

interface ModeSelectorProps {
  fileName: string;
  fileType: string;
  onSelect: (mode: "ai" | "manual") => void;
  onBack?: () => void;
}

export function ModeSelector({
  fileName,
  fileType,
  onSelect,
  onBack,
}: ModeSelectorProps) {
  const kind = getUploadFileKind({ name: fileName, type: fileType });
  const spreadsheet = isSpreadsheetKind(kind);

  const aiDescription = spreadsheet
    ? "AI reads the data and summarizes what this file is about."
    : "AI reads the document and fills in title, category, owner, and more automatically.";

  return (
    <div className="space-y-6">
      <div className="rounded border border-default bg-[var(--color-bg-secondary)] p-4">
        <div className="flex items-center gap-3">
          <DocumentTypeIcon fileName={fileName} fileType={fileType} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {fileName}
            </p>
            <p className="text-xs text-secondary">Selected file</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-foreground">
          How would you like to process this file?
        </h3>
        <p className="mt-1 text-sm text-secondary">
          Choose AI analysis or enter details manually.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect("ai")}
          className="group rounded-2xl border border-default bg-surface p-5 text-left transition hover:border-primary hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-subtle text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-primary-subtle px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Recommended
            </span>
          </div>
          <h4 className="mt-4 text-sm font-semibold text-foreground">
            Analyse with AI
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            {aiDescription}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelect("manual")}
          className="group rounded-2xl border border-default bg-surface p-5 text-left transition hover:border-default hover:bg-[var(--color-bg-secondary)]"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-bg-secondary)] text-secondary">
              <Pencil className="h-5 w-5" />
            </span>
            <span className="rounded-full bg-[var(--color-bg-secondary)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-secondary">
              Faster
            </span>
          </div>
          <h4 className="mt-4 text-sm font-semibold text-foreground">
            Fill manually
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            Skip AI analysis. Just enter a title and save the document quickly.
          </p>
        </button>
      </div>

      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-secondary transition hover:text-foreground"
        >
          ← Change file
        </button>
      ) : null}
    </div>
  );
}
