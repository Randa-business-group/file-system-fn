import Image from "next/image";
import { cn } from "@/lib/utils";
import { getDocumentFileMeta } from "@/lib/upload-file-types";

type DocumentTypeIconSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<DocumentTypeIconSize, string> = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-12 w-12",
};

interface DocumentTypeIconProps {
  fileName: string;
  fileType?: string;
  size?: DocumentTypeIconSize;
  className?: string;
}

export function DocumentTypeIcon({
  fileName,
  fileType,
  size = "md",
  className,
}: DocumentTypeIconProps) {
  const meta = getDocumentFileMeta(fileName, fileType);
  const sizeClass = SIZE_CLASSES[size];
  const dimension = size === "sm" ? 36 : size === "md" ? 44 : 48;

  return (
    <div
      className={cn("relative shrink-0", sizeClass, className)}
      aria-hidden
    >
      <Image
        src={meta.iconSrc}
        alt=""
        width={dimension}
        height={dimension}
        className="h-full w-full object-contain"
        draggable={false}
      />
    </div>
  );
}

export function DocumentTypeChip({
  fileName,
  fileType,
  className,
}: {
  fileName: string;
  fileType?: string;
  className?: string;
}) {
  const meta = getDocumentFileMeta(fileName, fileType);

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        meta.chipClassName,
        className,
      )}
    >
      {meta.typeLabel}
    </span>
  );
}
