import { queryOptions } from '@tanstack/react-query';
import { getDiscussionComments, getShowcase } from './service';

export const showcaseKeys = {
  all: ['showcase'] as const,
  comments: (submissionId: string) => ['showcase', 'comments', submissionId] as const
};
export const showcaseQueryOptions = () =>
  queryOptions({ queryKey: showcaseKeys.all, queryFn: getShowcase });
export const discussionCommentsQueryOptions = (submissionId: string) =>
  queryOptions({
    queryKey: showcaseKeys.comments(submissionId),
    queryFn: () => getDiscussionComments(submissionId)
  });
