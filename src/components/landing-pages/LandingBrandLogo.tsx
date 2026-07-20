import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/file-browser-icon.png";

export function LandingBrandLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex shrink-0 items-center gap-2.5 no-underline hover:no-underline",
        className,
      )}
    >
      <Image
        src={LOGO_SRC}
        alt="Bika-File"
        width={36}
        height={36}
        className="h-9 w-9 object-contain"
        priority
      />
      <span className="text-lg font-semibold tracking-tight text-foreground">
        Bika-File
      </span>
    </Link>
  );
}
