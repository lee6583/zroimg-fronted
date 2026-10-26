"use client";

import { useRouter } from "next/navigation";
import { PublishGalleryButton } from "@/features/gallery/publish-button";
import type { GallerySubmission } from "@/types/gallery";

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
