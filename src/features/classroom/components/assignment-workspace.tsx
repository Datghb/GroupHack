'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
  assignmentKeys,
  assignmentsQueryOptions,
  assignmentQueryOptions,
  assignmentProgressQueryOptions,
  assignmentTeamsQueryOptions,
  classroomCoursesQueryOptions
} from '../api/assignment-queries';
import {
  createAssignment,
  createAssignmentTeam,
  deleteAssignment,
  joinAssignmentTeam,
  reviewTeamJoinRequest,
  setCheckpointCompleted,
  selectClassroomCourse,
  updateAssignment
} from '../api/assignment-service';
import type {
  AssignmentRecord,
  AssignmentTeamRecord,
  CheckpointScope
} from '../api/assignment-types';
import { toIsoDateTime, toLocalDateTime } from '../domain/assignment-dates';
import { getCheckpointScopeLabel } from '../domain/checkpoint-scope';

const assignmentSchema = z.object({
  title: z.string().trim().min(3, 'Tên bài tập cần ít nhất 3 ký tự'),
  description: z.string().trim().max(1000),
  dueAt: z.string()
});
const teamSchema = z.object({
  name: z.string().trim().min(2, 'Tên nhóm cần ít nhất 2 ký tự'),
  capacity: z.number().min(2).max(10)
});
type AssignmentValues = z.infer<typeof assignmentSchema>;
type TeamValues = z.infer<typeof teamSchema>;
interface CheckpointDraft {
  id?: string;
  title: string;
  description: string;
  dueAt: string;
  scope: CheckpointScope;
}

const EMPTY_CHECKPOINT: CheckpointDraft = {
  title: '',
  description: '',
  dueAt: '',
  scope: 'TEAM'
};

function TeamMiniCard({
  team,
  currentUserId,
  joining,
  reviewing,
  onJoin,
  onReview
}: {
  team: AssignmentTeamRecord;
  currentUserId?: string;
  joining: boolean;
  reviewing: boolean;
  onJoin: () => void;
  onReview: (requestId: string, action: 'APPROVE' | 'REJECT') => void;
}) {
  const isMember = team.memberIds.includes(currentUserId ?? '');
  const isLeader = team.leaderId === currentUserId;
  const full = team.memberIds.length >= team.capacity;
  return (
    <Card className={isMember ? 'ring-2 ring-primary/60' : ''}>
      <CardHeader>
        <CardTitle className='truncate'>{team.name}</CardTitle>
        {isMember && (
          <CardAction>
            <Badge variant={isLeader ? 'default' : 'secondary'}>
              {isLeader ? 'Trưởng nhóm' : 'Nhóm của bạn'}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center justify-between gap-3'>
          <AvatarGroup aria-label={`Thành viên nhóm ${team.name}`}>
            {team.members.slice(0, 6).map((member) => (
              <Avatar key={member.id} size='sm' title={member.fullName}>
                <AvatarImage src={member.avatarUrl || ''} alt={member.fullName} />
                <AvatarFallback>{member.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          <span className='shrink-0 text-xs text-muted-foreground'>
            {team.memberIds.length}/{team.capacity} thành viên
          </span>
        </div>
        {!isMember && (
          <Button
            size='sm'
            variant='outline'
            className='w-full'
            disabled={!team.open || full || joining || team.myRequestStatus === 'PENDING'}
            onClick={onJoin}
          >
            {full
              ? 'Nhóm đã đầy'
              : team.myRequestStatus === 'PENDING'
                ? 'Đang chờ trưởng nhóm duyệt'
                : team.myRequestStatus === 'REJECTED'
                  ? 'Gửi lại yêu cầu'
                  : 'Xin vào nhóm'}
          </Button>
        )}
        {isLeader && team.joinRequests.length > 0 && (
          <div className='space-y-2 border-t pt-3'>
            <p className='text-sm font-medium'>Yêu cầu vào nhóm</p>
            {team.joinRequests.map((request) => (
              <div key={request.id} className='flex items-center gap-2 rounded-md border p-2'>
                <Avatar size='sm'>
                  <AvatarImage
                    src={request.student.avatarUrl || ''}
                    alt={request.student.fullName}
                  />
                  <AvatarFallback>
                    {request.student.fullName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className='min-w-0 flex-1 truncate text-sm'>{request.student.fullName}</span>
                <Button
                  size='sm'
                  variant='ghost'
                  disabled={reviewing || full}
                  onClick={() => onReview(request.id, 'REJECT')}
                >
                  Từ chối
                </Button>
                <Button
                  size='sm'
                  disabled={reviewing || full}
                  onClick={() => onReview(request.id, 'APPROVE')}
                >
                  Duyệt
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TeacherAssignmentManager({ classId }: { classId: string }) {
  const [open, setOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentRecord | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [checkpoints, setCheckpoints] = useState<CheckpointDraft[]>([EMPTY_CHECKPOINT]);
  const queryClient = useQueryClient();
  const { data: courseData } = useQuery(classroomCoursesQueryOptions(classId));
  const effectiveCourseId = selectedCourseId || courseData?.courses[0]?.id || '';
  const effectiveCourseName = courseData?.courses.find(
    (course) => course.id === effectiveCourseId
  )?.name;
  const {
    data = [],
    isPending,
    error
  } = useQuery({
    ...assignmentsQueryOptions(classId, effectiveCourseId),
    enabled: !!effectiveCourseId,
    retry: false
  });
  const mutation = useMutation({
    mutationFn: (value: AssignmentValues) => {
      const validCheckpoints = checkpoints
        .map((item) => ({
          ...item,
          title: item.title.trim(),
          dueAt: toIsoDateTime(item.dueAt)
        }))
        .filter((item) => item.title.length >= 2);
      if (!validCheckpoints.length) throw new Error('Cần thiết kế ít nhất một checkpoint.');
      if (editingAssignment)
        return updateAssignment(classId, editingAssignment.id, {
          ...value,
          dueAt: toIsoDateTime(value.dueAt),
          checkpoints: validCheckpoints
        });
      if (!effectiveCourseId) throw new Error('Lớp chưa có khóa học.');
      return createAssignment(classId, {
        ...value,
        dueAt: toIsoDateTime(value.dueAt),
        courseId: effectiveCourseId,
        checkpoints: validCheckpoints
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assignmentKeys.all })
  });
  const deleteMutation = useMutation({
    mutationFn: (assignmentId: string) => deleteAssignment(classId, assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.list(classId, effectiveCourseId)
      });
      toast.success('Đã xóa bài tập.');
    },
    onError: (deleteError) => toast.error(deleteError.message)
  });
  const { FormTextField, FormTextareaField } = useFormFields<AssignmentValues>();
  const form = useAppForm({
    defaultValues: {
      title: '',
      description: '',
      dueAt: ''
    } as AssignmentValues,
    validators: { onSubmit: assignmentSchema },
    onSubmit: async ({ value }) => {
      try {
        await mutation.mutateAsync(value);
        form.reset();
        setCheckpoints([EMPTY_CHECKPOINT]);
        setOpen(false);
        toast.success(editingAssignment ? 'Đã cập nhật bài tập.' : 'Đã tạo bài tập và checkpoint.');
        setEditingAssignment(null);
      } catch (submitError) {
        toast.error(submitError instanceof Error ? submitError.message : 'Không thể lưu bài tập.');
      }
    }
  });
  const openCreateDialog = () => {
    setEditingAssignment(null);
    form.reset({ title: '', description: '', dueAt: '' });
    setCheckpoints([EMPTY_CHECKPOINT]);
    setOpen(true);
  };
  const openEditDialog = (assignment: AssignmentRecord) => {
    setEditingAssignment(assignment);
    form.reset({
      title: assignment.title,
      description: assignment.description,
      dueAt: toLocalDateTime(assignment.dueAt)
    });
    setCheckpoints(
      assignment.checkpoints.map((checkpoint) => ({
        id: checkpoint.id,
        title: checkpoint.title,
        description: checkpoint.description,
        dueAt: toLocalDateTime(checkpoint.dueAt),
        scope: checkpoint.scope
      }))
    );
    setOpen(true);
  };
  if (isPending) return <Skeleton className='h-48 w-full' />;
  if (error) return <p className='text-destructive'>{error.message}</p>;
  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-end gap-2'>
        <div className='flex items-center gap-2'>
          <Label>Khóa</Label>
          <Select
            value={effectiveCourseId}
            onValueChange={(value) => setSelectedCourseId(value ?? '')}
          >
            <SelectTrigger className='min-w-36'>
              <SelectValue placeholder='Chọn khóa'>{effectiveCourseName}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {courseData?.courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreateDialog}>
          <Icons.add data-icon='inline-start' />
          Tạo bài tập
        </Button>
      </div>
      {!data.length && (
        <Card>
          <CardHeader>
            <CardTitle>Chưa có bài tập</CardTitle>
            <CardDescription>Hãy tạo bài tập đầu tiên và thiết kế các checkpoint.</CardDescription>
          </CardHeader>
        </Card>
      )}
      <div className='grid gap-4 md:grid-cols-2'>
        {data.map((assignment) => (
          <Card key={assignment.id}>
            <CardHeader>
              <CardTitle>{assignment.title}</CardTitle>
              <CardDescription>
                {assignment.description || 'Bài tập chưa có mô tả.'}
              </CardDescription>
              <CardAction>
                <Badge variant='secondary'>{assignment.checkpoints.length} checkpoint</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className='space-y-2'>
              {assignment.checkpoints.map((checkpoint, index) => (
                <div key={checkpoint.id} className='rounded-lg border p-3 text-sm'>
                  <span className='font-medium'>
                    {index + 1}. {checkpoint.title}
                  </span>
                  <Badge
                    variant={checkpoint.scope === 'INDIVIDUAL' ? 'outline' : 'secondary'}
                    className='ml-2'
                  >
                    {getCheckpointScopeLabel(checkpoint.scope)}
                  </Badge>
                  {checkpoint.dueAt && (
                    <span className='ml-2 text-muted-foreground'>
                      · Hạn {new Date(checkpoint.dueAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              ))}
              <Button
                variant='outline'
                render={
                  <Link
                    href={`/teacher/classes/${classId}/assignments/${assignment.id}/monitor`}
                    aria-label={`Theo dõi tiến độ bài tập ${assignment.title}`}
                  />
                }
              >
                <Icons.trendingUp /> Theo dõi tiến độ
              </Button>
              <Button variant='outline' onClick={() => openEditDialog(assignment)}>
                <Icons.edit data-icon='inline-start' />
                Chỉnh sửa
              </Button>
              <Button
                variant='ghost'
                className='text-destructive'
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      `Xóa bài tập “${assignment.title}” và toàn bộ dữ liệu liên quan?`
                    )
                  )
                    deleteMutation.mutate(assignment.id);
                }}
              >
                <Icons.trash /> Xóa bài tập
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setEditingAssignment(null);
        }}
      >
        <DialogContent className='max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editingAssignment ? 'Chỉnh sửa bài tập' : 'Tạo bài tập'}</DialogTitle>
            <DialogDescription>
              {editingAssignment
                ? 'Cập nhật nội dung và các checkpoint của bài tập.'
                : 'Thiết kế ít nhất một checkpoint trước khi tạo bài tập.'}
            </DialogDescription>
          </DialogHeader>
          <form.AppForm>
            <form.Form id='assignment-form' className='p-0'>
              <FormTextField name='title' label='Tên bài tập' required />
              <FormTextareaField name='description' label='Mô tả (không bắt buộc)' />
              <form.AppField name='dueAt'>
                {(field) => (
                  <field.FieldSet>
                    <field.Field>
                      <field.FieldLabel htmlFor={field.name}>
                        Hạn hoàn thành bài tập
                      </field.FieldLabel>
                      <Input
                        id={field.name}
                        type='datetime-local'
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                      />
                    </field.Field>
                    <field.FieldError />
                  </field.FieldSet>
                )}
              </form.AppField>
            </form.Form>
          </form.AppForm>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label>Danh sách checkpoint</Label>
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => setCheckpoints((items) => [...items, { ...EMPTY_CHECKPOINT }])}
              >
                <Icons.add />
                Thêm checkpoint
              </Button>
            </div>
            {checkpoints.map((checkpoint, index) => (
              <div key={index} className='space-y-2 rounded-lg border p-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Checkpoint {index + 1}</span>
                  {checkpoints.length > 1 && (
                    <Button
                      type='button'
                      size='icon'
                      variant='ghost'
                      onClick={() =>
                        setCheckpoints((items) =>
                          items.filter((_, itemIndex) => itemIndex !== index)
                        )
                      }
                    >
                      <Icons.trash />
                    </Button>
                  )}
                </div>
                <Input
                  aria-label={`Tên checkpoint ${index + 1}`}
                  placeholder='Tên checkpoint'
                  value={checkpoint.title}
                  onChange={(event) =>
                    setCheckpoints((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, title: event.target.value } : item
                      )
                    )
                  }
                />
                <div className='flex flex-col gap-2'>
                  <Label>Phạm vi checkpoint</Label>
                  <Select
                    value={checkpoint.scope}
                    onValueChange={(value) => {
                      if (!value) return;
                      setCheckpoints((items) =>
                        items.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                scope: value as CheckpointScope
                              }
                            : item
                        )
                      );
                    }}
                  >
                    <SelectTrigger aria-label={`Phạm vi checkpoint ${index + 1}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value='INDIVIDUAL'>Cá nhân</SelectItem>
                        <SelectItem value='TEAM'>Nhóm</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  aria-label={`Mô tả checkpoint ${index + 1}`}
                  placeholder='Mô tả (không bắt buộc)'
                  value={checkpoint.description}
                  onChange={(event) =>
                    setCheckpoints((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, description: event.target.value } : item
                      )
                    )
                  }
                />
                <div>
                  <Label>Hạn checkpoint</Label>
                  <Input
                    type='datetime-local'
                    value={checkpoint.dueAt}
                    onChange={(event) =>
                      setCheckpoints((items) =>
                        items.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, dueAt: event.target.value } : item
                        )
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type='submit' form='assignment-form' disabled={mutation.isPending}>
              {mutation.isPending
                ? 'Đang lưu...'
                : editingAssignment
                  ? 'Lưu thay đổi'
                  : 'Tạo bài tập'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function StudentAssignmentList({ classId }: { classId: string }) {
  const [courseOverride, setCourseOverride] = useState('');
  const queryClient = useQueryClient();
  const { data: courseData, isPending: coursesPending } = useQuery(
    classroomCoursesQueryOptions(classId)
  );
  const selectedCourseId =
    courseOverride || courseData?.selectedCourseId || courseData?.courses[0]?.id || '';
  const selectedCourseName = courseData?.courses.find(
    (course) => course.id === selectedCourseId
  )?.name;
  const {
    data = [],
    isPending,
    error
  } = useQuery({
    ...assignmentsQueryOptions(classId, selectedCourseId),
    enabled: !!selectedCourseId,
    retry: false
  });
  const selectMutation = useMutation({
    mutationFn: (courseId: string) => selectClassroomCourse(classId, courseId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.courses(classId)
      }),
    onError: (selectError) => {
      setCourseOverride('');
      toast.error(selectError.message);
    }
  });
  if (isPending || coursesPending) return <Skeleton className='h-48 w-full' />;
  if (error) return <p className='text-destructive'>{error.message}</p>;
  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <div className='flex items-center gap-2'>
          <Label>Khóa đang học</Label>
          <Select
            value={selectedCourseId}
            onValueChange={(value) => {
              if (!value) return;
              setCourseOverride(value);
              selectMutation.mutate(value);
            }}
          >
            <SelectTrigger className='min-w-36'>
              <SelectValue placeholder='Chọn khóa'>{selectedCourseName}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {courseData?.courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      {!data.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Chưa có bài tập</CardTitle>
            <CardDescription>Giáo viên chưa tạo bài tập cho khóa này.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2'>
          {data.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <CardTitle>{assignment.title}</CardTitle>
                <CardDescription>
                  {assignment.description || 'Bài tập chưa có mô tả.'}
                </CardDescription>
                <CardAction>
                  <Badge variant='outline'>{assignment.checkpoints.length} checkpoint</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <Button
                  render={
                    <Link
                      href={`/student/classes/${classId}/assignments/${assignment.id}`}
                      aria-label={`Mở bài tập ${assignment.title}`}
                    />
                  }
                >
                  Mở bài tập và chọn nhóm
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function StudentAssignmentWorkspace({
  classId,
  assignmentId
}: {
  classId: string;
  assignmentId: string;
}) {
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const {
    data: assignment,
    isPending: assignmentPending,
    error: assignmentError
  } = useQuery(assignmentQueryOptions(classId, assignmentId));
  const {
    data: teams = [],
    isPending: teamsPending,
    error: teamsError
  } = useQuery(assignmentTeamsQueryOptions(classId, assignmentId));
  const {
    data: progress = [],
    isPending: progressPending,
    error: progressError
  } = useQuery(assignmentProgressQueryOptions(classId, assignmentId));
  const createMutation = useMutation({
    mutationFn: (value: TeamValues) =>
      createAssignmentTeam(classId, assignmentId, {
        ...value,
        description: ''
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.teams(classId, assignmentId)
      }),
    onError: (createError) => toast.error(createError.message)
  });
  const joinMutation = useMutation({
    mutationFn: (teamId: string) => joinAssignmentTeam(classId, assignmentId, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.teams(classId, assignmentId)
      });
      toast.success('Đã gửi yêu cầu đến trưởng nhóm.');
    },
    onError: (joinError) => toast.error(joinError.message)
  });
  const reviewMutation = useMutation({
    mutationFn: ({
      teamId,
      requestId,
      action
    }: {
      teamId: string;
      requestId: string;
      action: 'APPROVE' | 'REJECT';
    }) => reviewTeamJoinRequest(classId, assignmentId, teamId, requestId, action),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.teams(classId, assignmentId)
      });
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.progress(classId, assignmentId)
      });
      toast.success(
        variables.action === 'APPROVE' ? 'Đã duyệt học sinh vào nhóm.' : 'Đã từ chối yêu cầu.'
      );
    },
    onError: (reviewError) => toast.error(reviewError.message)
  });
  const progressMutation = useMutation({
    mutationFn: ({ checkpointId, completed }: { checkpointId: string; completed: boolean }) =>
      setCheckpointCompleted(classId, assignmentId, checkpointId, completed),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.progress(classId, assignmentId)
      }),
    onError: (mutationError) => toast.error(mutationError.message)
  });
  const { FormTextField } = useFormFields<TeamValues>();
  const form = useAppForm({
    defaultValues: { name: '', capacity: 5 } as TeamValues,
    validators: { onSubmit: teamSchema },
    onSubmit: async ({ value }) => {
      try {
        await createMutation.mutateAsync(value);
        form.reset();
        setOpen(false);
        toast.success('Đã tạo nhóm. Bạn là trưởng nhóm.');
      } catch {
        // Mutation đã hiển thị thông báo lỗi.
      }
    }
  });
  const loadError = assignmentError ?? teamsError ?? progressError;
  if (loadError) return <p className='text-destructive'>{loadError.message}</p>;
  if (assignmentPending || teamsPending || progressPending || !assignment)
    return <Skeleton className='h-64 w-full' />;
  const ownTeam = teams.find((team) => team.memberIds.includes(user?.id ?? ''));
  const ownProgress = progress.find((team) => team.id === ownTeam?.id);
  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>{assignment.title}</CardTitle>
          <CardDescription>{assignment.description || 'Bài tập chưa có mô tả.'}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-2'>
          {assignment.checkpoints.map((checkpoint, index) => (
            <div
              key={checkpoint.id}
              className='flex items-center justify-between gap-3 rounded-lg border p-3'
            >
              <div>
                <div className='flex flex-wrap items-center gap-2'>
                  <p className='font-medium'>
                    {index + 1}. {checkpoint.title}
                  </p>
                  <Badge variant={checkpoint.scope === 'INDIVIDUAL' ? 'outline' : 'secondary'}>
                    {getCheckpointScopeLabel(checkpoint.scope)}
                  </Badge>
                </div>
                <p className='text-sm text-muted-foreground'>
                  {checkpoint.description || 'Không có mô tả.'}
                  {checkpoint.dueAt
                    ? ` · Hạn ${new Date(checkpoint.dueAt).toLocaleString('vi-VN')}`
                    : ''}
                </p>
              </div>
              {ownTeam &&
                (() => {
                  const completed =
                    ownProgress?.myCompletedCheckpointIds.includes(checkpoint.id) ?? false;
                  return (
                    <Button
                      size='sm'
                      variant={completed ? 'secondary' : 'outline'}
                      disabled={progressMutation.isPending}
                      onClick={() =>
                        progressMutation.mutate({
                          checkpointId: checkpoint.id,
                          completed: !completed
                        })
                      }
                    >
                      <Icons.check /> {completed ? 'Đã xong' : 'Đánh dấu xong'}
                    </Button>
                  );
                })()}
            </div>
          ))}
        </CardContent>
      </Card>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Nhóm của bài tập</h2>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            render={
              <Link
                href={`/student/classes/${classId}/assignments/${assignmentId}/community`}
                aria-label='Xem tiến độ các nhóm'
              />
            }
          >
            <Icons.trendingUp /> Tiến độ các nhóm
          </Button>
          {!ownTeam && (
            <Button onClick={() => setOpen(true)}>
              <Icons.add />
              Tạo nhóm
            </Button>
          )}
        </div>
      </div>
      {teams.length ? (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {teams.map((team) => (
            <TeamMiniCard
              key={team.id}
              team={team}
              currentUserId={user?.id}
              joining={joinMutation.isPending}
              reviewing={reviewMutation.isPending}
              onJoin={() => joinMutation.mutate(team.id)}
              onReview={(requestId, action) =>
                reviewMutation.mutate({ teamId: team.id, requestId, action })
              }
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Chưa có nhóm</CardTitle>
            <CardDescription>Hãy tạo nhóm đầu tiên cho bài tập này.</CardDescription>
          </CardHeader>
        </Card>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo nhóm cho bài tập</DialogTitle>
            <DialogDescription>Người tạo đầu tiên tự động là trưởng nhóm.</DialogDescription>
          </DialogHeader>
          <form.AppForm>
            <form.Form id='assignment-team-form' className='p-0'>
              <FormTextField name='name' label='Tên nhóm' required />
              <form.AppField name='capacity'>
                {(field) => (
                  <field.FieldSet>
                    <field.Field>
                      <field.FieldLabel htmlFor={field.name}>Số thành viên tối đa</field.FieldLabel>
                      <Input
                        id={field.name}
                        type='number'
                        min={2}
                        max={10}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(Number(event.target.value))}
                      />
                    </field.Field>
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
            <Button type='submit' form='assignment-team-form' disabled={createMutation.isPending}>
              Tạo nhóm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
