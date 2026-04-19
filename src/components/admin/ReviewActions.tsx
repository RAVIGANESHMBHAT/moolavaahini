"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { approvePost, rejectPost } from "@/actions/review.actions";
import { useRouter } from "next/navigation";

interface ReviewActionsProps {
  postId: string;
  postUpdatedAt: string;
}

export function ReviewActions({ postId, postUpdatedAt }: ReviewActionsProps) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [isApproving, startApprove] = useTransition();
  const [isRejecting, startReject] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleApprove = () => {
    setError(null);
    startApprove(async () => {
      const result = await approvePost(postId, postUpdatedAt);
      if (!result.success) {
        setError(result.error);
      } else {
        router.push("/admin/review");
        router.refresh();
      }
    });
  };

  const handleReject = () => {
    setError(null);
    startReject(async () => {
      const result = await rejectPost(postId, reason, postUpdatedAt);
      if (!result.success) {
        setError(result.error);
      } else {
        router.push("/admin/review");
        router.refresh();
      }
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface2 p-5">
      <h3 className="mb-3 text-sm font-semibold text-tx2">
        {t("reviewActions")}
      </h3>

      {error && (
        <div className="mb-3 rounded-lg bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger-text)]">
          {error}
        </div>
      )}

      {!showRejectForm ? (
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={handleApprove} loading={isApproving} disabled={isRejecting}>
            {t("approve")}
          </Button>
          <Button variant="danger" onClick={() => setShowRejectForm(true)} disabled={isApproving || isRejecting}>
            {t("reject")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Textarea
            label={t("rejectionReason")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("rejectionPlaceholder")}
            rows={3}
            required
          />
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleReject} loading={isRejecting} disabled={!reason.trim()}>
              {t("confirmReject")}
            </Button>
            <Button variant="ghost" onClick={() => { setShowRejectForm(false); setReason(""); }} disabled={isRejecting}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
