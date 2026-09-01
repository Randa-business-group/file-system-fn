"use client";

import { useEffect, useState } from "react";
import { Library, Send } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { RoleBadge } from "@/components/ui/Badge";
import { DocumentTypeIcon } from "@/components/documents/DocumentTypeIcon";
import { useAuth } from "@/lib/auth-context";
import { useMarkShareAsRead, useReplyToShare } from "@/lib/hooks/useSharing";
import { formatTimeAgo } from "@/lib/format-time";
import type { DocumentShare } from "@/types/sharing";

interface ShareReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  share: DocumentShare;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ShareReplyModal({ isOpen, onClose, share }: ShareReplyModalProps) {
  const { user } = useAuth();
  const replyToShare = useReplyToShare();
  const markShareAsRead = useMarkShareAsRead();
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    if (!isOpen || share.isRead) return;
    markShareAsRead.mutate(share.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mark read once when opened
  }, [isOpen, share.id, share.isRead]);

  const itemName =
    share.document?.title ||
    share.document?.fileName ||
    share.collection?.name ||
    "Shared item";

  const handleSubmit = async () => {
    const trimmed = replyMessage.trim();
    if (!trimmed) return;

    try {
      await replyToShare.mutateAsync({
        id: share.id,
        data: { message: trimmed },
      });
      setReplyMessage("");
      toast.success("Reply sent");
    } catch {
      toast.error("Failed to send reply");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share conversation">
      <div className="space-y-4">
        <div className="rounded-2xl border border-default bg-[var(--color-bg-secondary)]/50 p-4">
          <div className="flex items-start gap-3">
            {share.collection ? (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface text-primary">
                <Library className="h-5 w-5" />
              </div>
            ) : (
              <DocumentTypeIcon
                fileName={share.document?.fileName ?? itemName}
                size="md"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{itemName}</p>
              {share.document?.category ? (
                <span className="mt-1 inline-flex rounded-full bg-[var(--color-bg-tertiary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-secondary">
                  {share.document.category.name}
                </span>
              ) : null}
              {share.collection ? (
                <p className="mt-1 text-xs text-secondary">
                  Collection · {share.collection.name}
                </p>
              ) : null}
            </div>
          </div>

          {share.message ? (
            <p className="mt-3 text-sm text-secondary">{share.message}</p>
          ) : null}

          <div className="mt-4 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
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
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-72 space-y-3 overflow-y-auto px-1">
          {share.replies.map((reply) => {
            const isMine = reply.user.id === user?.id;
            return (
              <div
                key={reply.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-4 py-3",
                    isMine
                      ? "bg-primary text-primary-foreground"
                      : "bg-[var(--color-bg-secondary)] text-foreground",
                  ].join(" ")}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={[
                        "text-xs font-semibold",
                        isMine ? "text-primary-foreground/90" : "text-foreground",
                      ].join(" ")}
                    >
                      {reply.user.name}
                    </span>
                    <span
                      className={[
                        "text-[10px]",
                        isMine ? "text-primary-foreground/70" : "text-secondary",
                      ].join(" ")}
                    >
                      {formatTimeAgo(reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{reply.message}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-default pt-4">
          <input
            type="text"
            value={replyMessage}
            onChange={(event) => setReplyMessage(event.target.value)}
            placeholder="Write a reply..."
            className="flex-1 rounded-2xl border border-default bg-[var(--color-bg-secondary)] px-4 py-2.5 text-sm text-foreground placeholder-secondary focus:border-primary focus:outline-none"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSubmit();
              }
            }}
          />
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!replyMessage.trim() || replyToShare.isLoading}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary-hover disabled:opacity-50"
            aria-label="Send reply"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
