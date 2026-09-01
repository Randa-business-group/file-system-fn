"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  Eye,
  ExternalLink,
  FolderOpen,
  Library,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { normalizeShare } from "@/api/sharing.api";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { ShareReplyModal } from "@/components/sharing/ShareReplyModal";
import { DocumentPreview } from "@/components/ui/DocumentPreview";
import { RoleBadge } from "@/components/ui/Badge";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  useDeleteShare,
  useGetInbox,
  useGetSent,
  useMarkShareAsRead,
} from "@/lib/hooks/useSharing";
import { useSocket } from "@/lib/socket-context";
import {
  formatTimeAgo,
  getHoursUntilExpiry,
  isShareExpired,
} from "@/lib/format-time";
import type { DocumentShare } from "@/types/sharing";
import type { DocumentShareApiRecord } from "@/api/sharing.api";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export type ShareInboxMode = "received" | "sent";

interface ShareInboxViewProps {
  mode: ShareInboxMode;
}

export function ShareInboxView({ mode }: ShareInboxViewProps) {
  const [replyShare, setReplyShare] = useState<DocumentShare | null>(null);
  const [previewUrl, setPreviewUrl] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const { on, off } = useSocket();
  const { shares: inboxShares, isLoading: isInboxLoading } = useGetInbox();
  const { shares: sentShares, isLoading: isSentLoading } = useGetSent();
  const markShareAsRead = useMarkShareAsRead();
  const deleteShare = useDeleteShare();

  const isReceived = mode === "received";

  useEffect(() => {
    const handleShareNew = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const share = normalizeShare(payload as DocumentShareApiRecord);
      if (isShareExpired(share.expiresAt)) return;

      queryClient.setQueryData<DocumentShare[]>(["inbox"], (current) => {
        const list = current ?? [];
        if (list.some((item) => item.id === share.id)) return list;
        return [share, ...list];
      });
    };

    const handleShareReply = (payload: unknown) => {
      if (!payload || typeof payload !== "object") return;
      const share = normalizeShare(payload as DocumentShareApiRecord);

      const updater = (list: DocumentShare[] | undefined) =>
        (list ?? []).map((item) => (item.id === share.id ? share : item));

      queryClient.setQueryData(["inbox"], updater);
      queryClient.setQueryData(["sent"], updater);
    };

    on("share:new", handleShareNew);
    on("share:reply", handleShareReply);

    return () => {
      off("share:new", handleShareNew);
      off("share:reply", handleShareReply);
    };
  }, [on, off, queryClient]);

  const handleMarkRead = (share: DocumentShare) => {
    if (!isReceived || share.isRead) return;
    markShareAsRead.mutate(share.id);
  };

  const handleDelete = async (shareId: string) => {
    try {
      await deleteShare.mutateAsync(shareId);
      toast.success("Share removed");
    } catch {
      toast.error("Failed to delete share");
    }
  };

  const handleDownload = (share: DocumentShare) => {
    const url = share.document?.fileUrl;
    if (!url) {
      toast.error("No file available to download");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const isLoading = isReceived ? isInboxLoading : isSentLoading;
  const list = isReceived ? inboxShares : sentShares;

  const emptyTitle = isReceived ? "No received shares" : "Nothing sent yet";
  const emptyDescription = isReceived
    ? "Shares from your team will appear here."
    : "Documents and collections you share will appear here.";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {isReceived ? "Received" : "Sent"}
        </h1>
        <p className="mt-1.5 text-sm text-secondary">
          {isReceived
            ? "Documents and collections shared with you."
            : "Items you have shared with others."}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <div key={index}>
              <LoadingSkeleton height={120} rounded="1rem" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-default bg-surface px-6 py-12 text-center">
          <h3 className="text-lg font-semibold text-foreground">{emptyTitle}</h3>
          <p className="mt-2 max-w-md text-sm text-secondary">{emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((share) => {
            const hoursLeft = getHoursUntilExpiry(share.expiresAt);
            const showExpiryWarning = hoursLeft > 0 && hoursLeft < 6;
            const itemName =
              share.document?.title ||
              share.document?.fileName ||
              share.collection?.name ||
              share.folder?.name ||
              "Shared item";
            const isBundleShare = Boolean(share.collection || share.folder);

            return (
              <article
                key={share.id}
                onClick={() => handleMarkRead(share)}
                className="rounded-2xl border border-default bg-surface p-4 shadow-sm transition hover:border-primary/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    {isReceived && !share.isRead ? (
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                    ) : null}
                    {isReceived ? (
                      <>
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
                          {getInitials(share.sharedBy.name)}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {share.sharedBy.name}
                            </span>
                            <RoleBadge role={share.sharedBy.role} />
                          </div>
                          <p className="text-xs text-secondary">
                            {formatTimeAgo(share.createdAt)}
                            {showExpiryWarning ? (
                              <span className="ml-2 font-semibold text-red-600">
                                Expires in {hoursLeft} hours
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
                          {getInitials(share.sharedTo.name)}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {share.sharedTo.name}
                        </span>
                        {share.isRead ? (
                          <span className="text-xs text-emerald-600">Read</span>
                        ) : (
                          <span className="text-xs text-secondary">Unread</span>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-secondary">
                    {isShareExpired(share.expiresAt)
                      ? "Expired"
                      : `Expires ${formatTimeAgo(share.expiresAt)}`}
                  </p>
                </div>

                <div className="mt-3 flex items-start gap-3 rounded-xl bg-[var(--color-bg-secondary)]/60 p-3">
                  {share.collection ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-primary">
                      <Library className="h-5 w-5" />
                    </div>
                  ) : share.folder ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-primary">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                  ) : (
                    <DocumentTypeIcon
                      fileName={share.document?.fileName ?? itemName}
                      size="sm"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {itemName}
                    </p>
                    {share.document?.category ? (
                      <span className="mt-1 inline-flex rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-secondary">
                        {share.document.category.name}
                      </span>
                    ) : null}
                    {share.collection ? (
                      <p className="mt-1 text-xs text-secondary">
                        Collection · {share.collection.documentCount} document
                        {share.collection.documentCount === 1 ? "" : "s"}
                      </p>
                    ) : null}
                    {share.folder ? (
                      <p className="mt-1 text-xs text-secondary">
                        Folder · open to browse documents
                      </p>
                    ) : null}
                  </div>
                </div>

                {share.message ? (
                  <p className="mt-2 line-clamp-2 text-sm text-secondary">
                    {share.message}
                  </p>
                ) : null}

                {share.replies.length > 0 ? (
                  <p className="mt-2 text-xs font-medium text-secondary">
                    {share.replies.length}{" "}
                    {share.replies.length === 1 ? "reply" : "replies"}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {isBundleShare ? (
                    <Link
                      href={`/dashboard/inbox/${share.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open & review
                    </Link>
                  ) : null}
                  {share.document?.fileUrl ? (
                    <>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPreviewUrl({
                            url: share.document!.fileUrl,
                            name: share.document!.fileName,
                            type: "application/pdf",
                          });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-default px-3 py-1.5 text-xs font-medium text-foreground hover:bg-[var(--color-bg-secondary)]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDownload(share);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-default px-3 py-1.5 text-xs font-medium text-foreground hover:bg-[var(--color-bg-secondary)]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setReplyShare(share);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-default px-3 py-1.5 text-xs font-medium text-foreground hover:bg-[var(--color-bg-secondary)]"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Reply
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDelete(share.id);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-default px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {replyShare ? (
        <ShareReplyModal
          isOpen={Boolean(replyShare)}
          onClose={() => setReplyShare(null)}
          share={replyShare}
        />
      ) : null}

      {previewUrl ? (
        <DocumentPreview
          isOpen
          onClose={() => setPreviewUrl(null)}
          fileUrl={previewUrl.url}
          fileName={previewUrl.name}
          fileType={previewUrl.type}
        />
      ) : null}
    </div>
  );
}
