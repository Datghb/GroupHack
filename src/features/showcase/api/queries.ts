import { queryOptions } from '@tanstack/react-query';
import { getDiscussionComments, getShowcase } from './service';

export const showcaseKeys = {
  all: ['showcase'] as const,
  comments: (submissionId: string) => ['showcase', 'comments', submissionId] as const
};
export const showcaseQueryOptions = () =>
  queryOptions({
    queryKey: showcaseKeys.all,
    queryFn: getShowcase,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false
  });
export const discussionCommentsQueryOptions = (submissionId: string) =>
  queryOptions({
    queryKey: showcaseKeys.comments(submissionId),
    queryFn: () => getDiscussionComments(submissionId),
    staleTime: 0,
    refetchInterval: 2_000,
    refetchIntervalInBackground: false
  });
