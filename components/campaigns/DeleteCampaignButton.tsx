"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ApiResponse<T> = {
  data: T;
  error: { code: string; message: string } | null;
};

type DeleteCampaignButtonProps = {
  campaignId: string;
  campaignName: string;
  status: string;
  redirectTo?: string;
  onDeleted?: () => void;
  variant?: "default" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

export function DeleteCampaignButton({
  campaignId,
  campaignName,
  status,
  redirectTo = "/campaigns",
  onDeleted,
  variant = "destructive",
  size = "default",
  className,
}: DeleteCampaignButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const isSending = status === "sending";

  async function handleDelete() {
    if (isSending) return;

    const confirmed = window.confirm(
      `Delete "${campaignName}"? This will permanently remove the campaign and its send history.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/v1/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      const payload: ApiResponse<{ deleted: boolean }> = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message ?? "Delete failed");
      }

      onDeleted?.();
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => void handleDelete()}
      loading={deleting}
      loadingText="Deleting..."
      disabled={isSending || deleting}
      title={isSending ? "Cannot delete while the campaign is sending" : undefined}
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </Button>
  );
}
