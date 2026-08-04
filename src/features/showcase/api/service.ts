import type {
  CreateCriterionPayload,
  CreateDiscussionCommentPayload,
  DiscussionComment,
  ReviewProductPayload,
  ShowcaseResponse,
  SubmitProductPayload
} from './types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers }
  });
  const body = (await response.json()) as { data?: T; error?: string };
  if (!response.ok || !body.data) throw new Error(body.error ?? 'Không thể xử lý yêu cầu.');
  return body.data;
}

export const getShowcase = () => request<ShowcaseResponse>('/api/showcase');
export const submitProduct = (payload: SubmitProductPayload) =>
  request('/api/showcase', { method: 'POST', body: JSON.stringify(payload) });
export const reviewProduct = (submissionId: string, payload: ReviewProductPayload) =>
  request(`/api/showcase/${submissionId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
export const createCriterion = (payload: CreateCriterionPayload) =>
  request('/api/showcase/criteria', { method: 'POST', body: JSON.stringify(payload) });
export const deleteCriterion = (criterionId: string) =>
  request(`/api/showcase/criteria/${criterionId}`, { method: 'DELETE' });
export const getDiscussionComments = (submissionId: string) =>
  request<DiscussionComment[]>(`/api/showcase/${submissionId}/comments`);
export const createDiscussionComment = (
  submissionId: string,
  payload: CreateDiscussionCommentPayload
) =>
  request<DiscussionComment>(`/api/showcase/${submissionId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
