'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
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
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
  assignmentKeys,
  assignmentsQueryOptions,
  assignmentQueryOptions,
  assignmentTeamsQueryOptions
} from '../api/assignment-queries';
import {
  createAssignment,
  createAssignmentTeam,
  joinAssignmentTeam
} from '../api/assignment-service';

const assignmentSchema = z.object({
  title: z.string().trim().min(3, 'Tên bài tập cần ít nhất 3 ký tự'),
  description: z.string().trim().max(1000),
  dueAt: z.string()
});
const teamSchema = z.object({
  name: z.string().trim().min(2, 'Tên nhóm cần ít nhất 2 ký tự'),
  description: z.string().trim().max(300),
  capacity: z.number().min(2).max(10)
});
type AssignmentValues = z.infer<typeof assignmentSchema>;
type TeamValues = z.infer<typeof teamSchema>;
interface CheckpointDraft {
  title: string;
  description: string;
  dueAt: string;
}

export function TeacherAssignmentManager({ classId }: { classId: string }) {
  const [open, setOpen] = useState(false);
  const [checkpoints, setCheckpoints] = useState<CheckpointDraft[]>([
    { title: '', description: '', dueAt: '' }
  ]);
  const queryClient = useQueryClient();
  const {
    data = [],
    isPending,
    error
  } = useQuery({ ...assignmentsQueryOptions(classId), retry: false });
  const mutation = useMutation({
    mutationFn: (value: AssignmentValues) => {
      const validCheckpoints = checkpoints
        .map((item) => ({ ...item, title: item.title.trim() }))
        .filter((item) => item.title.length >= 2);
      if (!validCheckpoints.length) throw new Error('Cần thiết kế ít nhất một checkpoint.');
      return createAssignment(classId, {
        ...value,
        checkpoints: validCheckpoints
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: assignmentKeys.list(classId) })
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
        setCheckpoints([{ title: '', description: '', dueAt: '' }]);
        setOpen(false);
        toast.success('Đã tạo bài tập và checkpoint.');
      } catch (submitError) {
        toast.error(submitError instanceof Error ? submitError.message : 'Không thể tạo bài tập.');
      }
    }
  });
  if (isPending) return <Skeleton className='h-48 w-full' />;
  if (error) return <p className='text-destructive'>{error.message}</p>;
  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <Button onClick={() => setOpen(true)}>
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
                  {checkpoint.dueAt && (
                    <span className='ml-2 text-muted-foreground'>
                      · Hạn {new Date(checkpoint.dueAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Tạo bài tập</DialogTitle>
            <DialogDescription>
              Thiết kế ít nhất một checkpoint trước khi tạo bài tập.
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
                onClick={() =>
                  setCheckpoints((items) => [...items, { title: '', description: '', dueAt: '' }])
                }
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
              {mutation.isPending ? 'Đang tạo...' : 'Tạo bài tập'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function StudentAssignmentList({ classId }: { classId: string }) {
  const {
    data = [],
    isPending,
    error
  } = useQuery({ ...assignmentsQueryOptions(classId), retry: false });
  if (isPending) return <Skeleton className='h-48 w-full' />;
  if (error) return <p className='text-destructive'>{error.message}</p>;
  if (!data.length)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chưa có bài tập</CardTitle>
          <CardDescription>Giáo viên chưa tạo bài tập cho lớp này.</CardDescription>
        </CardHeader>
      </Card>
    );
  return (
    <div className='grid gap-4 md:grid-cols-2'>
      {data.map((assignment) => (
        <Card key={assignment.id}>
          <CardHeader>
            <CardTitle>{assignment.title}</CardTitle>
            <CardDescription>{assignment.description || 'Bài tập chưa có mô tả.'}</CardDescription>
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
  const { data: assignment, isPending: assignmentPending } = useQuery(
    assignmentQueryOptions(classId, assignmentId)
  );
  const { data: teams = [], isPending: teamsPending } = useQuery(
    assignmentTeamsQueryOptions(classId, assignmentId)
  );
  const createMutation = useMutation({
    mutationFn: (value: TeamValues) => createAssignmentTeam(classId, assignmentId, value),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.teams(classId, assignmentId)
      })
  });
  const joinMutation = useMutation({
    mutationFn: (teamId: string) => joinAssignmentTeam(classId, assignmentId, teamId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.teams(classId, assignmentId)
      })
  });
  const { FormTextField, FormTextareaField } = useFormFields<TeamValues>();
  const form = useAppForm({
    defaultValues: { name: '', description: '', capacity: 5 } as TeamValues,
    validators: { onSubmit: teamSchema },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync(value);
      form.reset();
      setOpen(false);
      toast.success('Đã tạo nhóm. Bạn là trưởng nhóm.');
    }
  });
  if (assignmentPending || teamsPending || !assignment) return <Skeleton className='h-64 w-full' />;
  const ownTeam = teams.find((team) => team.memberIds.includes(user?.id ?? ''));
  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>{assignment.title}</CardTitle>
          <CardDescription>{assignment.description || 'Bài tập chưa có mô tả.'}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-2'>
          {assignment.checkpoints.map((checkpoint, index) => (
            <div key={checkpoint.id} className='rounded-lg border p-3'>
              <p className='font-medium'>
                {index + 1}. {checkpoint.title}
              </p>
              <p className='text-sm text-muted-foreground'>
                {checkpoint.description || 'Không có mô tả.'}
                {checkpoint.dueAt
                  ? ` · Hạn ${new Date(checkpoint.dueAt).toLocaleString('vi-VN')}`
                  : ''}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Nhóm của bài tập</h2>
        {!ownTeam && (
          <Button onClick={() => setOpen(true)}>
            <Icons.add />
            Tạo nhóm
          </Button>
        )}
      </div>
      {ownTeam ? (
        <Card>
          <CardHeader>
            <CardTitle>{ownTeam.name}</CardTitle>
            <CardDescription>{ownTeam.description || 'Nhóm chưa có mô tả.'}</CardDescription>
            <CardAction>
              <Badge>{ownTeam.leaderId === user?.id ? 'Bạn là trưởng nhóm' : 'Thành viên'}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {ownTeam.memberIds.length}/{ownTeam.capacity} thành viên
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 md:grid-cols-2'>
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <CardTitle>{team.name}</CardTitle>
                <CardDescription>{team.description || 'Nhóm chưa có mô tả.'}</CardDescription>
              </CardHeader>
              <CardContent className='flex items-center justify-between'>
                <span>
                  {team.memberIds.length}/{team.capacity} thành viên
                </span>
                <Button
                  disabled={
                    !team.open || team.memberIds.length >= team.capacity || joinMutation.isPending
                  }
                  onClick={() => joinMutation.mutate(team.id)}
                >
                  Tham gia
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
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
              <FormTextareaField name='description' label='Mô tả (không bắt buộc)' />
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
