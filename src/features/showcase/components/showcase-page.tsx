'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { showcaseKeys, showcaseQueryOptions } from '../api/queries';
import { discussionCommentsQueryOptions } from '../api/queries';
import {
  createCriterion,
  createDiscussionComment,
  deleteCriterion,
  reviewProduct,
  submitProduct,
  updateReviewMode
} from '../api/service';
import type { DiscussionComment, ProductSubmission, ShowcaseResponse } from '../api/types';

const submissionSchema = z.object({
  assignmentId: z.string().min(1, 'Hãy chọn bài tập'),
  title: z.string().trim().min(3, 'Tên sản phẩm cần ít nhất 3 ký tự').max(120),
  description: z.string().trim().max(1000),
  websiteUrl: z
    .string()
    .url('Hãy nhập link website hợp lệ')
    .refine((url) => /^https?:\/\//i.test(url), 'Link phải bắt đầu bằng http:// hoặc https://')
});
const reviewSchema = z.object({
  scores: z
    .array(
      z.object({
        criterionId: z.string().uuid(),
        score: z.number().int().min(1).max(5)
      })
    )
    .min(1)
});
const criterionSchema = z.object({
  assignmentId: z.string().min(1, 'Hãy chọn bài tập'),
  criteria: z
    .array(
      z.object({
        title: z.string().trim().min(2, 'Tên tiêu chí cần ít nhất 2 ký tự').max(120),
        description: z.string().trim().max(500)
      })
    )
    .min(1)
    .max(20)
});
const discussionSchema = z.object({
  content: z.string().trim().min(1).max(1000)
});
type SubmissionValues = z.infer<typeof submissionSchema>;
type ReviewValues = z.infer<typeof reviewSchema>;
type CriterionValues = z.infer<typeof criterionSchema>;
type DiscussionValues = z.infer<typeof discussionSchema>;

function RatingStars({ submission }: { submission: ProductSubmission }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type='button'
            className='flex cursor-help items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-amber-500 shadow-sm outline-none transition-colors hover:border-amber-500/70 hover:bg-amber-500/20 focus-visible:ring-2 focus-visible:ring-ring'
            aria-label={`Điểm trung bình ${submission.ratingAverage.toFixed(1)} trên 5, ${submission.ratingCount} lượt đánh giá`}
          />
        }
      >
        <Icons.star className='size-4 fill-current' />
        <span className='text-sm font-semibold text-foreground'>
          {submission.ratingAverage.toFixed(1)}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side='bottom'
        align='end'
        className='w-72 max-w-[calc(100vw-2rem)] flex-col items-stretch gap-2 p-3'
      >
        <div className='flex items-center justify-between gap-3 border-b border-background/20 pb-2'>
          <span className='font-medium'>Điểm theo tiêu chí</span>
          <span>{submission.ratingCount} lượt đánh giá</span>
        </div>
        {submission.criterionSummaries.length ? (
          submission.criterionSummaries.map((summary) => {
            const criterion = submission.criteria.find((item) => item.id === summary.criterionId);
            return criterion ? (
              <div key={summary.criterionId} className='flex justify-between gap-3'>
                <span className='truncate'>{criterion.title}</span>
                <span className='shrink-0 font-semibold'>
                  {summary.count ? summary.average.toFixed(1) : '0.0'}/5
                </span>
              </div>
            ) : null;
          })
        ) : (
          <span>Chưa có tiêu chí đánh giá.</span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function WebsitePreview({ submission }: { submission: ProductSubmission }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shouldLoad) return;

    let loadTimer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        loadTimer = setTimeout(() => setShouldLoad(true), 600);
        observer.disconnect();
      },
      { rootMargin: '80px' }
    );
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (loadTimer) clearTimeout(loadTimer);
    };
  }, [shouldLoad]);

  return (
    <div ref={containerRef} className='relative h-56 overflow-hidden border-y bg-muted sm:h-64'>
      {shouldLoad ? (
        <iframe
          src={submission.websiteUrl}
          title={`Bản xem trước ${submission.title}`}
          className='absolute inset-0 bg-background'
          style={{
            width: '153.85%',
            height: '153.85%',
            transform: 'scale(0.65)',
            transformOrigin: 'top left'
          }}
          loading='lazy'
          referrerPolicy='no-referrer'
          sandbox='allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts'
        />
      ) : (
        <button
          type='button'
          className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/50 text-sm text-muted-foreground transition-colors hover:bg-muted'
          onClick={() => setShouldLoad(true)}
        >
          <Icons.externalLink className='size-5' />
          <span>Tải bản xem trước</span>
        </button>
      )}
      <div className='pointer-events-none absolute inset-x-0 top-0 h-8 bg-linear-to-b from-black/20 to-transparent' />
    </div>
  );
}

function CriteriaManager({
  assignments
}: {
  assignments: ShowcaseResponse['manageableAssignments'];
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: createCriterion,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: showcaseKeys.all });
      form.reset();
      setOpen(false);
      toast.success('Đã thêm tiêu chí đánh giá.');
    },
    onError: (error) => toast.error(error.message)
  });
  const removeMutation = useMutation({
    mutationFn: deleteCriterion,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: showcaseKeys.all });
      toast.success('Đã xóa tiêu chí.');
    },
    onError: (error) => toast.error(error.message)
  });
  const reviewModeMutation = useMutation({
    mutationFn: updateReviewMode,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: showcaseKeys.all });
      toast.success('Đã cập nhật cách học sinh chấm bài.');
    },
    onError: (error) => toast.error(error.message)
  });
  const form = useAppForm({
    defaultValues: {
      assignmentId: '',
      criteria: [{ title: '', description: '' }]
    } as CriterionValues,
    validators: { onSubmit: criterionSchema },
    onSubmit: ({ value }) => createMutation.mutateAsync(value)
  });
  const { FormSelectField } = useFormFields<CriterionValues>();
  return (
    <Card>
      <CardHeader>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <CardTitle>Tiêu chí đánh giá theo bài tập</CardTitle>
            <CardDescription>
              Học sinh phải chấm đủ các tiêu chí, mỗi tiêu chí tối đa 5 sao.
            </CardDescription>
          </div>
          <Button onClick={() => setOpen(true)} disabled={!assignments.length}>
            <Icons.add data-icon='inline-start' /> Thêm tiêu chí
          </Button>
        </div>
      </CardHeader>
      <CardContent className='grid gap-4 lg:grid-cols-2'>
        {assignments.map((assignment) => (
          <div key={assignment.assignmentId} className='rounded-lg border p-4'>
            <div className='mb-3 flex flex-wrap items-start justify-between gap-3'>
              <div>
                <p className='font-medium'>{assignment.assignmentTitle}</p>
                <p className='text-sm text-muted-foreground'>{assignment.classroomName}</p>
              </div>
              <div className='flex rounded-lg border bg-muted/30 p-1'>
                <Button
                  type='button'
                  size='sm'
                  variant={assignment.reviewMode === 'TEAM' ? 'default' : 'ghost'}
                  className='h-7 px-2.5 text-xs'
                  disabled={reviewModeMutation.isPending}
                  onClick={() =>
                    reviewModeMutation.mutate({
                      assignmentId: assignment.assignmentId,
                      reviewMode: 'TEAM'
                    })
                  }
                >
                  Theo nhóm
                </Button>
                <Button
                  type='button'
                  size='sm'
                  variant={assignment.reviewMode === 'INDIVIDUAL' ? 'default' : 'ghost'}
                  className='h-7 px-2.5 text-xs'
                  disabled={reviewModeMutation.isPending}
                  onClick={() =>
                    reviewModeMutation.mutate({
                      assignmentId: assignment.assignmentId,
                      reviewMode: 'INDIVIDUAL'
                    })
                  }
                >
                  Theo cá nhân
                </Button>
              </div>
            </div>
            <p className='mb-3 text-xs text-muted-foreground'>
              Đổi cách chấm sẽ xóa các lượt chấm cũ của học sinh; điểm giáo viên được giữ lại.
            </p>
            {assignment.criteria.length ? (
              <div className='space-y-2'>
                {assignment.criteria.map((criterion, index) => (
                  <div
                    key={criterion.id}
                    className='flex items-start gap-3 rounded-md bg-muted/50 p-3'
                  >
                    <Badge variant='secondary'>{index + 1}</Badge>
                    <div className='min-w-0 flex-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <p className='font-medium'>{criterion.title}</p>
                        <Badge variant='outline'>Tối đa 5 sao</Badge>
                      </div>
                      {criterion.description ? (
                        <p className='text-sm text-muted-foreground'>{criterion.description}</p>
                      ) : null}
                    </div>
                    <Button
                      size='icon-sm'
                      variant='ghost'
                      aria-label={`Xóa tiêu chí ${criterion.title}`}
                      disabled={removeMutation.isPending}
                      onClick={() => removeMutation.mutate(criterion.id)}
                    >
                      <Icons.trash />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>Chưa có tiêu chí.</p>
            )}
          </div>
        ))}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm tiêu chí đánh giá</DialogTitle>
            <DialogDescription>
              Tiêu chí chỉ áp dụng cho bài tập được chọn và luôn chấm theo thang 1–5 sao.
            </DialogDescription>
          </DialogHeader>
          <form.AppForm>
            <form.Form id='criterion-form' className='space-y-4 p-0'>
              <FormSelectField
                name='assignmentId'
                label='Bài tập'
                required
                placeholder='Chọn bài tập'
                options={assignments.map((item) => ({
                  value: item.assignmentId,
                  label: `${item.assignmentTitle} · ${item.classroomName}`
                }))}
              />
              <form.AppField name='criteria'>
                {(field) => (
                  <field.FieldSet>
                    <div className='flex items-center justify-between gap-3'>
                      <field.FieldLabel>Danh sách tiêu chí</field.FieldLabel>
                      <Badge variant='outline'>{field.state.value.length}/20 tiêu chí</Badge>
                    </div>
                    <div className='max-h-[min(48vh,30rem)] space-y-3 overflow-y-auto pr-1'>
                      {field.state.value.map((criterion, index) => (
                        <div key={index} className='space-y-3 rounded-lg border p-4'>
                          <div className='flex items-center justify-between gap-3'>
                            <p className='font-medium'>Tiêu chí {index + 1}</p>
                            {field.state.value.length > 1 ? (
                              <Button
                                type='button'
                                size='icon-sm'
                                variant='ghost'
                                aria-label={`Xóa tiêu chí ${index + 1}`}
                                onClick={() =>
                                  field.handleChange(
                                    field.state.value.filter((_, itemIndex) => itemIndex !== index)
                                  )
                                }
                              >
                                <Icons.trash />
                              </Button>
                            ) : null}
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor={`criterion-title-${index}`}>Tên tiêu chí *</Label>
                            <Input
                              id={`criterion-title-${index}`}
                              value={criterion.title}
                              placeholder='Ví dụ: Giao diện và trải nghiệm'
                              onChange={(event) =>
                                field.handleChange(
                                  field.state.value.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, title: event.target.value }
                                      : item
                                  )
                                )
                              }
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor={`criterion-description-${index}`}>Mô tả</Label>
                            <Textarea
                              id={`criterion-description-${index}`}
                              rows={2}
                              value={criterion.description}
                              placeholder='Điều học sinh cần quan sát khi chấm...'
                              onChange={(event) =>
                                field.handleChange(
                                  field.state.value.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? {
                                          ...item,
                                          description: event.target.value
                                        }
                                      : item
                                  )
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      className='w-full'
                      disabled={field.state.value.length >= 20}
                      onClick={() =>
                        field.handleChange([...field.state.value, { title: '', description: '' }])
                      }
                    >
                      <Icons.add data-icon='inline-start' /> Thêm tiêu chí khác
                    </Button>
                    <field.FieldError />
                  </field.FieldSet>
                )}
              </form.AppField>
            </form.Form>
          </form.AppForm>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type='submit' form='criterion-form' disabled={createMutation.isPending}>
              {createMutation.isPending ? <Icons.spinner className='animate-spin' /> : null}
              Lưu toàn bộ tiêu chí
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ReviewDialog({
  submission,
  open,
  onOpenChange
}: {
  submission: ProductSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (value: ReviewValues) => reviewProduct(submission!.id, value),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: showcaseKeys.all });
      onOpenChange(false);
      toast.success('Đã lưu đánh giá của nhóm bạn.');
    },
    onError: (error) => toast.error(error.message)
  });
  const form = useAppForm({
    defaultValues: {
      scores: (submission?.criteria ?? []).map((criterion) => ({
        criterionId: criterion.id,
        score:
          submission?.myReview?.scores.find((score) => score.criterionId === criterion.id)?.score ??
          5
      }))
    } as ReviewValues,
    validators: { onSubmit: reviewSchema },
    onSubmit: ({ value }) => mutation.mutateAsync(value)
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đánh giá {submission?.title}</DialogTitle>
          <DialogDescription>
            Mỗi nhóm có một lượt đánh giá và có thể cập nhật lại.
          </DialogDescription>
        </DialogHeader>
        <form.AppForm>
          <form.Form id='review-product-form' className='space-y-4 p-0'>
            <form.AppField name='scores'>
              {(field) => (
                <field.FieldSet>
                  <field.FieldLabel>Chấm từng tiêu chí (tối đa 5 sao)</field.FieldLabel>
                  <div className='space-y-3'>
                    {submission?.criteria.map((criterion, criterionIndex) => (
                      <div key={criterion.id} className='rounded-lg border p-3'>
                        <p className='font-medium'>{criterion.title}</p>
                        {criterion.description ? (
                          <p className='text-sm text-muted-foreground'>{criterion.description}</p>
                        ) : null}
                        <div className='mt-2 flex gap-1'>
                          {[1, 2, 3, 4, 5].map((score) => (
                            <Button
                              key={score}
                              type='button'
                              size='icon-sm'
                              variant='ghost'
                              aria-label={`${criterion.title}: ${score} sao`}
                              onClick={() =>
                                field.handleChange(
                                  field.state.value.map((item, index) =>
                                    index === criterionIndex ? { ...item, score } : item
                                  )
                                )
                              }
                            >
                              <Icons.star
                                className={
                                  score <= field.state.value[criterionIndex].score
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-muted-foreground'
                                }
                              />
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <field.FieldError />
                </field.FieldSet>
              )}
            </form.AppField>
          </form.Form>
        </form.AppForm>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type='submit' form='review-product-form' disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Icons.spinner className='animate-spin' data-icon='inline-start' />
            ) : null}
            Lưu đánh giá
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getAuthorInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return initials || 'TV';
}

function DiscussionMessage({
  comment,
  isReply = false,
  onReply
}: {
  comment: DiscussionComment;
  isReply?: boolean;
  onReply?: () => void;
}) {
  const isTeacher = comment.authorRole === 'TEACHER';

  return (
    <div className='flex items-start gap-2.5'>
      <Avatar className='mt-0.5 size-8 shrink-0'>
        <AvatarFallback
          className={
            isTeacher
              ? 'bg-primary text-xs font-semibold text-primary-foreground'
              : 'bg-muted text-xs font-semibold text-muted-foreground'
          }
        >
          {getAuthorInitials(comment.authorName)}
        </AvatarFallback>
      </Avatar>
      <div className='min-w-0 flex-1'>
        <div className='inline-block max-w-full rounded-2xl rounded-tl-sm bg-muted/70 px-3.5 py-2.5'>
          <div className='mb-1 flex flex-wrap items-center gap-x-2 gap-y-1'>
            <span className='text-sm font-semibold'>{comment.authorName}</span>
            <Badge variant={isTeacher ? 'default' : 'secondary'} className='h-5 px-1.5 text-[10px]'>
              {isTeacher ? 'Giảng viên' : 'Học sinh'}
            </Badge>
          </div>
          <p className='whitespace-pre-wrap break-words text-sm leading-5'>{comment.content}</p>
        </div>
        <div className='mt-1 flex items-center gap-2 px-1 text-xs text-muted-foreground'>
          <time dateTime={comment.createdAt}>
            {new Date(comment.createdAt).toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </time>
          {!isReply && onReply ? (
            <button
              type='button'
              className='font-medium text-foreground/70 hover:text-foreground hover:underline'
              onClick={onReply}
            >
              Trả lời
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DiscussionDialog({
  submission,
  open,
  onOpenChange
}: {
  submission: ProductSubmission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const {
    data: comments = [],
    isPending,
    error
  } = useQuery(discussionCommentsQueryOptions(submission.id));
  const mutation = useMutation({
    mutationFn: (value: DiscussionValues) =>
      createDiscussionComment(submission.id, {
        content: value.content,
        parentId: replyingTo
      }),
    onSuccess: (createdComment) => {
      queryClient.setQueryData<DiscussionComment[]>(
        showcaseKeys.comments(submission.id),
        (current = []) =>
          current.some((comment) => comment.id === createdComment.id)
            ? current
            : [...current, createdComment]
      );
      void queryClient.invalidateQueries({ queryKey: showcaseKeys.all });
      form.reset();
      setReplyingTo(null);
    },
    onError: (submitError) => toast.error(submitError.message)
  });
  const form = useAppForm({
    defaultValues: { content: '' } as DiscussionValues,
    validators: { onSubmit: discussionSchema },
    onSubmit: ({ value }) => mutation.mutateAsync(value)
  });
  const rootComments = comments.filter((comment) => !comment.parentId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[85vh] sm:max-w-xl'>
        <DialogHeader className='shrink-0 border-b px-5 py-4 pr-12'>
          <DialogTitle>Thảo luận về {submission.title}</DialogTitle>
          <DialogDescription className='text-sm'>
            Giáo viên và học sinh trong lớp có thể trao đổi và trả lời lẫn nhau.
          </DialogDescription>
        </DialogHeader>
        <div className='min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain bg-muted/20 px-5 py-4'>
          {isPending ? <Skeleton className='h-20 w-full rounded-xl' /> : null}
          {error ? (
            <p className='rounded-lg bg-destructive/10 p-3 text-sm text-destructive'>
              {error.message}
            </p>
          ) : null}
          {!isPending && !error && !rootComments.length ? (
            <div className='rounded-xl border border-dashed bg-background/60 p-6 text-center text-sm text-muted-foreground'>
              Chưa có bình luận. Hãy bắt đầu cuộc thảo luận.
            </div>
          ) : null}
          {rootComments.map((comment) => {
            const replies = comments.filter((item) => item.parentId === comment.id);
            return (
              <div key={comment.id} className='space-y-3'>
                <DiscussionMessage comment={comment} onReply={() => setReplyingTo(comment.id)} />
                {replies.length ? (
                  <div className='ml-4 space-y-3 border-l-2 border-border/70 pl-4 sm:ml-8'>
                    {replies.map((reply) => (
                      <DiscussionMessage key={reply.id} comment={reply} isReply />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <form.AppForm>
          <form.Form
            id='discussion-form'
            className='shrink-0 space-y-2 border-t bg-background px-5 py-3'
          >
            {replyingTo ? (
              <div className='flex items-center justify-between rounded-lg bg-muted px-3 py-1.5 text-xs'>
                <span className='text-muted-foreground'>Đang trả lời bình luận</span>
                <button
                  type='button'
                  className='font-medium hover:underline'
                  onClick={() => setReplyingTo(null)}
                >
                  Hủy
                </button>
              </div>
            ) : null}
            <form.AppField name='content'>
              {(field) => (
                <field.FieldSet>
                  <field.Field>
                    <field.FieldLabel htmlFor='discussion-content' className='sr-only'>
                      Bình luận
                    </field.FieldLabel>
                    <Textarea
                      id='discussion-content'
                      rows={2}
                      className='min-h-20 resize-none'
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder='Viết câu hỏi hoặc chia sẻ ý kiến...'
                    />
                  </field.Field>
                  <field.FieldError />
                </field.FieldSet>
              )}
            </form.AppField>
          </form.Form>
        </form.AppForm>
        <DialogFooter className='m-0 shrink-0 rounded-none border-t bg-muted/30 px-5 py-3'>
          <Button type='submit' form='discussion-form' disabled={mutation.isPending} size='sm'>
            {mutation.isPending ? <Icons.spinner className='animate-spin' /> : <Icons.send />}
            Gửi bình luận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ShowcasePage() {
  const [publishOpen, setPublishOpen] = useState(false);
  const [reviewing, setReviewing] = useState<ProductSubmission | null>(null);
  const [discussing, setDiscussing] = useState<ProductSubmission | null>(null);
  const queryClient = useQueryClient();
  const { data, isPending, error } = useQuery(showcaseQueryOptions());
  const mutation = useMutation({
    mutationFn: submitProduct,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: showcaseKeys.all });
      setPublishOpen(false);
      form.reset();
      toast.success('Sản phẩm đã xuất hiện trong showcase.');
    },
    onError: (submitError) => toast.error(submitError.message)
  });
  const form = useAppForm({
    defaultValues: {
      assignmentId: '',
      title: '',
      description: '',
      websiteUrl: ''
    } as SubmissionValues,
    validators: { onSubmit: submissionSchema },
    onSubmit: ({ value }) => mutation.mutateAsync(value)
  });
  const { FormTextField, FormTextareaField, FormSelectField } = useFormFields<SubmissionValues>();
  if (isPending) return <Skeleton className='h-96 w-full' />;
  if (error || !data)
    return <p className='text-destructive'>{error?.message ?? 'Không thể tải showcase.'}</p>;
  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4'>
        <div>
          <p className='font-medium'>Sân khấu sản phẩm của lớp</p>
          <p className='text-sm text-muted-foreground'>
            Mở website của các nhóm, trải nghiệm và để lại đánh giá công bằng.
          </p>
        </div>
        {data.canSubmit ? (
          <Button onClick={() => setPublishOpen(true)}>
            <Icons.add data-icon='inline-start' />
            Thêm sản phẩm
          </Button>
        ) : null}
      </div>
      {data.manageableAssignments.length ? (
        <CriteriaManager assignments={data.manageableAssignments} />
      ) : null}
      {data.submissions.length ? (
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {data.submissions.map((submission) => (
            <Card key={submission.id} className='overflow-hidden'>
              <CardHeader>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <CardTitle className='truncate'>{submission.title}</CardTitle>
                    <CardDescription>
                      {submission.teamName} · {submission.classroomName}
                    </CardDescription>
                  </div>
                  <RatingStars submission={submission} />
                </div>
              </CardHeader>
              <WebsitePreview submission={submission} />
              <CardContent className='space-y-4'>
                <p className='line-clamp-2 text-sm text-muted-foreground'>
                  {submission.description || 'Nhóm chưa thêm mô tả cho sản phẩm.'}
                </p>
                <div className='flex flex-wrap gap-2'>
                  <Badge variant='secondary'>{submission.assignmentTitle}</Badge>
                  <Badge variant='outline'>{submission.ratingCount} lượt đánh giá</Badge>
                  <Badge variant='outline'>
                    {submission.reviewMode === 'TEAM' ? 'Chấm theo nhóm' : 'Chấm theo cá nhân'}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className='mt-auto flex-wrap gap-2 border-t bg-muted/20'>
                <Button
                  className='flex-1'
                  render={
                    <a
                      href={submission.websiteUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      aria-label={`Mở website ${submission.title}`}
                    />
                  }
                >
                  <Icons.externalLink data-icon='inline-start' />
                  Mở website
                </Button>
                <Button variant='outline' onClick={() => setDiscussing(submission)}>
                  <Icons.chat /> Bình luận
                  {submission.commentCount ? ` (${submission.commentCount})` : ''}
                </Button>
                {data.canEvaluate ? (
                  <Button
                    variant='outline'
                    disabled={!submission.canReview || !submission.criteria.length}
                    title={
                      submission.canEdit
                        ? 'Nhóm không thể tự đánh giá sản phẩm của mình.'
                        : !submission.criteria.length
                          ? 'Giảng viên chưa tạo tiêu chí cho bài tập.'
                          : !submission.canReview
                            ? 'Bạn cần thuộc một nhóm khác trong cùng bài tập.'
                            : undefined
                    }
                    onClick={() => setReviewing(submission)}
                  >
                    <Icons.star />
                    {submission.canEdit
                      ? 'Sản phẩm nhóm bạn'
                      : !submission.criteria.length
                        ? 'Chưa có tiêu chí'
                        : !submission.canReview
                          ? 'Chưa thể đánh giá'
                          : submission.myReview
                            ? 'Sửa điểm'
                            : 'Đánh giá'}
                  </Button>
                ) : null}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Chưa có sản phẩm nào</CardTitle>
            <CardDescription>
              Sản phẩm đầu tiên sẽ xuất hiện khi một nhóm hoàn tất các checkpoint và đăng link
              website.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đăng sản phẩm website</DialogTitle>
            <DialogDescription>
              Chỉ các bài tập đã hoàn thành toàn bộ checkpoint mới có thể chọn.
            </DialogDescription>
          </DialogHeader>
          {data.publishableAssignments.length ? (
            <form.AppForm>
              <form.Form id='submit-product-form' className='space-y-4 p-0'>
                <FormSelectField
                  name='assignmentId'
                  label='Bài tập và nhóm'
                  required
                  placeholder='Chọn bài tập'
                  options={data.publishableAssignments.map((item) => ({
                    value: item.assignmentId,
                    label: `${item.assignmentTitle} · ${item.teamName}`
                  }))}
                />
                <FormTextField
                  name='title'
                  label='Tên sản phẩm'
                  required
                  placeholder='Ví dụ: Website du lịch Đà Nẵng'
                />
                <FormTextField
                  name='websiteUrl'
                  label='Link website'
                  required
                  type='url'
                  placeholder='https://san-pham-cua-nhom.vercel.app'
                />
                <FormTextareaField
                  name='description'
                  label='Mô tả ngắn'
                  rows={4}
                  placeholder='Sản phẩm giải quyết vấn đề gì, điểm nổi bật...'
                />
              </form.Form>
            </form.AppForm>
          ) : (
            <div className='rounded-lg border border-dashed p-4'>
              <p className='font-medium'>Chưa có bài tập đủ điều kiện đăng</p>
              <p className='mt-1 text-sm text-muted-foreground'>
                Nhóm cần hoàn thành toàn bộ checkpoint của ít nhất một bài tập. Sau đó quay lại đây
                để nhập URL và mô tả sản phẩm.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setPublishOpen(false)}>
              {data.publishableAssignments.length ? 'Hủy' : 'Đóng'}
            </Button>
            {data.publishableAssignments.length ? (
              <Button type='submit' form='submit-product-form' disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Icons.spinner className='animate-spin' data-icon='inline-start' />
                ) : null}
                Đăng và xem preview
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ReviewDialog
        key={reviewing?.id ?? 'none'}
        submission={reviewing}
        open={Boolean(reviewing)}
        onOpenChange={(open) => {
          if (!open) setReviewing(null);
        }}
      />
      {discussing ? (
        <DiscussionDialog
          submission={discussing}
          open
          onOpenChange={(open) => {
            if (!open) setDiscussing(null);
          }}
        />
      ) : null}
    </div>
  );
}
