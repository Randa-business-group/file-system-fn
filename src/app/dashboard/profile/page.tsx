"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ImageUploadField } from "@/components/profile/ImageUploadField";
import { ChangePasswordSection } from "@/components/profile/ChangePasswordSection";
import { TwoFactorSection } from "@/components/profile/TwoFactorSection";
import { OrgPageHeader } from "@/components/org/OrgPageHeader";
import { UnderlineField } from "@/components/auth/Underlinefield";
import { useAuth } from "@/lib/auth-context";
import { useUpdateProfile } from "@/lib/hooks/useProfile";
import type { AuthUser } from "@/types/auth";

function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

type ProfileEditorProps = {
  user: AuthUser;
  refreshUser: () => Promise<void>;
  updateProfile: ReturnType<typeof useUpdateProfile>["mutate"];
  isSaving: boolean;
};

function ProfileEditor({
  user,
  refreshUser,
  updateProfile,
  isSaving,
}: ProfileEditorProps) {
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [profileImage, setProfileImage] = useState<string | null>(
    user.profileImage ?? null,
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }

    updateProfile(
      {
        name: trimmedName,
        phone: phone.trim() || undefined,
        profileImage,
      },
      {
        onSuccess: async () => {
          await refreshUser();
          toast.success("Profile updated");
        },
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : "Unable to update profile.";
          toast.error(message);
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-8 rounded-2xl border border-default bg-surface p-6 shadow-sm sm:p-8"
    >
      <ImageUploadField
        label="Profile photo"
        description="Uploads immediately. Save the form to apply it to your account."
        value={profileImage}
        onChange={setProfileImage}
        purpose="profile"
        fallbackInitials={getInitials(name || user.name)}
        disabled={isSaving}
      />

      <div className="space-y-6">
        <UnderlineField
          id="profile-name"
          label="Full name"
          type="text"
          value={name}
          onChange={setName}
          disabled={isSaving}
        />

        <UnderlineField
          id="profile-email"
          label="Email"
          type="email"
          value={user.email}
          onChange={() => {}}
          disabled
        />

        <UnderlineField
          id="profile-phone"
          label="Phone (optional)"
          type="tel"
          value={phone}
          onChange={setPhone}
          disabled={isSaving}
        />
      </div>

      <div className="flex justify-end border-t border-default pt-6">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export default function DashboardProfilePage() {
  const { user, refreshUser, isLoading: isAuthLoading } = useAuth();
  const { mutate: updateProfile, isLoading: isSaving } = useUpdateProfile();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  if (isAuthLoading || !user) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-bg-secondary)]" />
        <div className="h-64 animate-pulse rounded-2xl bg-[var(--color-bg-secondary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <OrgPageHeader
        title="Settings"
        description="Update your name, phone, profile photo, password, and security settings. Email cannot be changed here."
      />

      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-default bg-surface p-2 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "profile"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-secondary hover:bg-[var(--color-bg-secondary)] hover:text-foreground"
            }`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "security"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-secondary hover:bg-[var(--color-bg-secondary)] hover:text-foreground"
            }`}
          >
            Security
          </button>
        </div>

        {activeTab === "profile" ? (
          <ProfileEditor
            key={`${user.email}-${user.name ?? ""}-${user.phone ?? ""}-${user.profileImage ?? ""}`}
            user={user}
            refreshUser={refreshUser}
            updateProfile={updateProfile}
            isSaving={isSaving}
          />
        ) : (
          <div className="space-y-6">
            <ChangePasswordSection />
            <TwoFactorSection />
          </div>
        )}
      </div>
    </div>
  );
}
