"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatVideoTime,
  parseHeroVideoUrl,
  type HeroVideoSource,
} from "./hero-video";

function HeroExpandOverlay({
  title,
  onExpand,
}: {
  title: string;
  onExpand: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="group/expand absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/0 transition hover:bg-black/25"
      aria-label={`Open ${title} in fullscreen`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition group-hover/expand:opacity-100">
        <Maximize2 className="h-5 w-5" />
      </span>
      <span className="rounded-full border border-white/20 bg-black/45 px-3 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition group-hover/expand:opacity-100">
        Watch fullscreen
      </span>
    </button>
  );
}

function HeroInlineYouTube({
  source,
  title,
  onExpand,
}: {
  source: Extract<HeroVideoSource, { kind: "youtube" }>;
  title: string;
  onExpand: () => void;
}) {
  return (
    <div className="relative h-full w-full bg-black">
      <iframe
        src={source.heroEmbedUrl}
        title={title}
        className="pointer-events-none absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <HeroExpandOverlay title={title} onExpand={onExpand} />
    </div>
  );
}

function HeroInlineDirect({
  source,
  title,
  onExpand,
}: {
  source: Extract<HeroVideoSource, { kind: "direct" }>;
  title: string;
  onExpand: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    void video.play().catch(() => undefined);
  }, []);

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        className="pointer-events-none h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={source.posterUrl}
      >
        <source src={source.src} />
      </video>
      <HeroExpandOverlay title={title} onExpand={onExpand} />
    </div>
  );
}

function HeroVideoPoster({
  posterUrl,
  title,
  onPlay,
}: {
  posterUrl?: string;
  title: string;
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="group relative h-full w-full overflow-hidden bg-[var(--color-bg-tertiary)]"
      aria-label={`Play ${title}`}
    >
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt=""
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
          unoptimized
          sizes="(max-width: 1024px) 100vw, 50vw"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary-subtle) 0%, var(--color-bg-secondary) 45%, var(--color-bg-tertiary) 100%)",
          }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/5 transition group-hover:from-black/55" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/25 transition duration-300 group-hover:scale-105 group-hover:ring-primary/40 sm:h-[4.5rem] sm:w-[4.5rem]">
          <span className="absolute inset-0 rounded-full bg-primary/30 blur-md" />
          <Play className="relative ml-1 h-7 w-7 fill-current sm:h-8 sm:w-8" />
        </span>
        <span className="rounded-full border border-white/20 bg-black/35 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          Watch demo
        </span>
      </div>
    </button>
  );
}

function ModalDirectVideo({
  source,
}: {
  source: Extract<HeroVideoSource, { kind: "direct" }>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => setIsPaused(true));
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  return (
    <div className="group/player relative aspect-video w-full bg-black">
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        playsInline
        controls={false}
        preload="metadata"
        poster={source.posterUrl}
        onClick={togglePlay}
        onPlay={() => setIsPaused(false)}
        onPause={() => setIsPaused(true)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onEnded={() => setIsPaused(true)}
      >
        <source src={source.src} />
        Your browser does not support the video tag.
      </video>

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-4 pt-10 transition-opacity duration-300",
          isPaused ? "opacity-100" : "opacity-0 group-hover/player:opacity-100",
        )}
      >
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
            aria-label={isPaused ? "Play video" : "Pause video"}
          >
            {isPaused ? (
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            ) : (
              <Pause className="h-4 w-4 fill-current" />
            )}
          </button>

          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{
                width: duration ? `${(currentTime / duration) * 100}%` : "0%",
              }}
            />
          </div>

          <span className="min-w-[4.5rem] text-right text-xs tabular-nums text-white/90">
            {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
          </span>

          <button
            type="button"
            onClick={toggleMute}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalYouTubeVideo({
  source,
  title,
}: {
  source: Extract<HeroVideoSource, { kind: "youtube" }>;
  title: string;
}) {
  return (
    <div className="relative aspect-video w-full bg-black">
      <iframe
        src={source.embedUrl}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

function HeroVideoModal({
  isOpen,
  onClose,
  source,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  source: HeroVideoSource;
  title: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:-right-12 sm:top-0"
          aria-label="Close video"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">
          {source.kind === "youtube" ? (
            <ModalYouTubeVideo source={source} title={title} />
          ) : (
            <ModalDirectVideo source={source} />
          )}
        </div>

        <p className="mt-4 text-center text-sm font-medium text-white/80">
          {title}
        </p>
      </div>
    </div>,
    document.body,
  );
}

function HeroInlinePlayer({
  source,
  title,
  posterUrl,
  modalOpen,
  onExpand,
}: {
  source: HeroVideoSource;
  title: string;
  posterUrl?: string;
  modalOpen: boolean;
  onExpand: () => void;
}) {
  if (modalOpen) {
    const previewPoster =
      posterUrl ??
      (source.kind === "youtube" ? source.posterUrl : source.posterUrl);

    return (
      <HeroVideoPoster
        posterUrl={previewPoster}
        title={title}
        onPlay={onExpand}
      />
    );
  }

  if (source.kind === "youtube") {
    return (
      <HeroInlineYouTube source={source} title={title} onExpand={onExpand} />
    );
  }

  return (
    <HeroInlineDirect source={source} title={title} onExpand={onExpand} />
  );
}

export function HeroVideoPlayer({
  url,
  title,
  posterUrl,
}: {
  url: string;
  title: string;
  posterUrl?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const source = parseHeroVideoUrl(url, posterUrl);

  return (
    <>
      <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
        <div className="relative overflow-hidden rounded-2xl border border-default bg-black shadow-xl">
          <div className="relative aspect-video">
            <HeroInlinePlayer
              source={source}
              title={title}
              posterUrl={posterUrl}
              modalOpen={modalOpen}
              onExpand={() => setModalOpen(true)}
            />
          </div>
        </div>
      </div>

      <HeroVideoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        source={source}
        title={title}
      />
    </>
  );
}
