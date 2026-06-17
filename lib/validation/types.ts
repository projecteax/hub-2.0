export type AssignmentStatus = "invited" | "in_review" | "submitted" | "declined";
export type ReviewVerdict = "verified" | "verified_with_flags" | "unable_to_verify";
export type ValidationStatus = "not_requested" | "requested" | "in_progress" | "complete";

export type ValidationAssignment = {
  id: string;
  validation_request_id: string;
  expert_user_id: string;
  status: AssignmentStatus;
  match_score: number;
  invited_at: string;
  submitted_at: string | null;
  verdict: ReviewVerdict | null;
  attested_name: string | null;
  attested_credentials: string | null;
  general_comment: string | null;
};

export type ValidationFlag = {
  id: string;
  assignment_id: string;
  section_key: string | null;
  flag_type: string;
  comment: string;
};

export type ValidationRequest = {
  id: string;
  project_id: string;
  status: ValidationStatus;
  target_expert_count: number;
  requested_by: string | null;
  created_at: string;
  completed_at: string | null;
};

export type ExpertMarketplaceItem = {
  assignmentId: string | null;
  projectId: string;
  projectTitle: string;
  industryCode: string;
  geographyCode: string;
  marketSegment: string;
  status: AssignmentStatus | "available";
  matchScore: number;
  invitedAt: string;
  validationStatus: ValidationStatus;
  verdict?: ReviewVerdict | null;
  submittedAt?: string | null;
  /** True when expert can claim this report (QA browse list). */
  isBrowseOnly?: boolean;
};

export type ExpertMarketplaceBundle = {
  open: ExpertMarketplaceItem[];
  history: ExpertMarketplaceItem[];
  browse: ExpertMarketplaceItem[];
  showAllReports: boolean;
};

export type ProjectValidationSummary = {
  request: ValidationRequest | null;
  assignments: Array<
    ValidationAssignment & {
      expertName: string | null;
      flags: ValidationFlag[];
    }
  >;
  isVerified: boolean;
  verifiedExpertCount: number;
};

export type SubmitReviewInput = {
  verdict: ReviewVerdict;
  attestedName: string;
  attestedCredentials: string;
  generalComment?: string;
  flags: Array<{
    sectionKey?: string;
    flagType?: string;
    comment: string;
  }>;
};
