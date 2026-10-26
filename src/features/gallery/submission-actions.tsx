"use client";

import { PublishGalleryButton } from "@/features/gallery/publish-button";
import type { GallerySubmission } from "@/types/gallery";
import { useRouter } from "@/i18n/navigation";

type SubmissionActionsProps = {
  submission: GallerySubmission;
};

export function SubmissionActions(props: SubmissionActionsProps) {
  const submission = props.submission;
  const router = useRouter();

  return (
    <PublishGalleryButton
      generatedImageId={submission.generatedImageId}
      initialStatus={submission.status}
      initialReason={submission.rejectReason}
      hideStatus
      onChange={() => router.refresh()}
    />
  );
}
