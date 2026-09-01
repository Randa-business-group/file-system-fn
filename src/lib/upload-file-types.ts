export type UploadFileKind = "pdf" | "word" | "excel" | "csv" | "image" | "unknown";

export interface DocumentFileMeta {
  kind: UploadFileKind;
  typeLabel: string;
  chipClassName: string;
  badgeClassName: string;
  iconClassName: string;
  iconSrc: string;
  mimeType: string;
}

export function getUploadFileKind(file: {
  type: string;
  name: string;
}): UploadFileKind {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    return "pdf";
  }

  if (
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    type === "application/msword" ||
    name.endsWith(".docx") ||
    name.endsWith(".doc")
  ) {
    return "word";
  }

  if (
    type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    type === "application/vnd.ms-excel" ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls")
  ) {
    return "excel";
  }

  if (type === "text/csv" || name.endsWith(".csv")) {
    return "csv";
  }

  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(name)) {
    return "image";
  }

  return "unknown";
}

export function isSpreadsheetKind(kind: UploadFileKind) {
  return kind === "excel" || kind === "csv";
}

const DOCUMENT_FILE_META: Record<
  UploadFileKind,
  Omit<DocumentFileMeta, "kind" | "mimeType"> & { mimeType: string }
> = {
  pdf: {
    typeLabel: "PDF document",
    chipClassName: "bg-red-50 text-red-700",
    badgeClassName: "bg-red-100",
    iconClassName: "text-red-600",
    iconSrc: "/pdf.png",
    mimeType: "application/pdf",
  },
  word: {
    typeLabel: "DOCX file",
    chipClassName: "bg-blue-50 text-blue-700",
    badgeClassName: "bg-blue-100",
    iconClassName: "text-blue-600",
    iconSrc: "/docx-file.png",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  excel: {
    typeLabel: "Spreadsheet",
    chipClassName: "bg-emerald-50 text-emerald-700",
    badgeClassName: "bg-emerald-100",
    iconClassName: "text-emerald-600",
    iconSrc: "/excel.png",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  csv: {
    typeLabel: "CSV file",
    chipClassName: "bg-teal-50 text-teal-700",
    badgeClassName: "bg-teal-100",
    iconClassName: "text-teal-600",
    iconSrc: "/csv.png",
    mimeType: "text/csv",
  },
  image: {
    typeLabel: "Image file",
    chipClassName: "bg-violet-50 text-violet-700",
    badgeClassName: "bg-violet-100",
    iconClassName: "text-violet-600",
    iconSrc: "/docs.png",
    mimeType: "image/jpeg",
  },
  unknown: {
    typeLabel: "Document",
    chipClassName: "bg-slate-100 text-slate-700",
    badgeClassName: "bg-slate-100",
    iconClassName: "text-slate-600",
    iconSrc: "/docs.png",
    mimeType: "application/octet-stream",
  },
};

export function getDocumentFileMeta(
  fileName: string,
  fileType?: string,
): DocumentFileMeta {
  const kind = getUploadFileKind({ name: fileName, type: fileType ?? "" });
  const base = DOCUMENT_FILE_META[kind];

  if (kind === "image") {
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
    const mimeType =
      fileType && fileType.startsWith("image/")
        ? fileType
        : extension === "jpg"
          ? "image/jpeg"
          : extension
            ? `image/${extension}`
            : base.mimeType;

    return {
      kind,
      ...base,
      mimeType,
      typeLabel: extension ? `${extension.toUpperCase()} image` : base.typeLabel,
    };
  }

  if (kind === "unknown") {
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
    return {
      kind,
      ...base,
      typeLabel: extension ? `${extension.toUpperCase()} file` : base.typeLabel,
    };
  }

  return {
    kind,
    ...base,
    mimeType: fileType && fileType !== "application/octet-stream" ? fileType : base.mimeType,
  };
}

export function getUploadFileKindLabel(kind: UploadFileKind) {
  return DOCUMENT_FILE_META[kind].typeLabel;
}

export function getUploadFileIcon(kind: UploadFileKind): {
  iconSrc: string;
  className: string;
  badgeClassName: string;
} {
  const meta = DOCUMENT_FILE_META[kind];
  return {
    iconSrc: meta.iconSrc,
    className: meta.iconClassName,
    badgeClassName: meta.badgeClassName,
  };
}

export const UPLOAD_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.csv,.docx";

export const UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
] as const;

export function isSupportedUploadFile(file: File) {
  return (
    UPLOAD_MIME_TYPES.includes(file.type as (typeof UPLOAD_MIME_TYPES)[number]) ||
    /\.(pdf|jpe?g|png|webp|docx|xlsx|csv)$/i.test(file.name)
  );
}

export function getFileTypeFromName(fileName: string) {
  return getDocumentFileMeta(fileName).mimeType;
}
