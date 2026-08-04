export interface ProductReview {
  id: string;
  rating: number;
  createdAt: string;
  scores: Array<{ criterionId: string; score: number }>;
}

export interface CriterionRatingSummary {
  criterionId: string;
  average: number;
  count: number;
}

export interface DiscussionComment {
  id: string;
  parentId: string | null;
  authorName: string;
  authorRole: 'TEACHER' | 'STUDENT';
  content: string;
  createdAt: string;
  isMine: boolean;
}

export interface ReviewCriterion {
  id: string;
  assignmentId: string;
  title: string;
  description: string;
  position: number;
}

export interface ProductSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  classroomName: string;
  teamId: string;
  teamName: string;
  title: string;
  description: string;
  websiteUrl: string;
  submittedAt: string;
  ratingAverage: number;
  ratingCount: number;
  canReview: boolean;
  canEdit: boolean;
  myReview: ProductReview | null;
  criteria: ReviewCriterion[];
  criterionSummaries: CriterionRatingSummary[];
  commentCount: number;
  reviewMode: 'TEAM' | 'INDIVIDUAL';
}

export interface ShowcaseResponse {
  canSubmit: boolean;
  canEvaluate: boolean;
  submissions: ProductSubmission[];
  publishableAssignments: Array<{
    assignmentId: string;
    assignmentTitle: string;
    teamId: string;
    teamName: string;
    existingSubmissionId: string | null;
  }>;
  manageableAssignments: Array<{
    assignmentId: string;
    assignmentTitle: string;
    classroomName: string;
    criteria: ReviewCriterion[];
    reviewMode: 'TEAM' | 'INDIVIDUAL';
  }>;
}

export interface SubmitProductPayload {
  assignmentId: string;
  title: string;
  description: string;
  websiteUrl: string;
}

export interface ReviewProductPayload {
  scores: Array<{ criterionId: string; score: number }>;
}

export interface CreateDiscussionCommentPayload {
  content: string;
  parentId?: string | null;
}

export interface CreateCriterionPayload {
  assignmentId: string;
  criteria: Array<{ title: string; description: string }>;
}

export interface UpdateReviewModePayload {
  assignmentId: string;
  reviewMode: 'TEAM' | 'INDIVIDUAL';
}
