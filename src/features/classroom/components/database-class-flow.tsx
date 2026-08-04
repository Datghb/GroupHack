'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { classroomKeys, classroomsQueryOptions, classroomTeamsQueryOptions } from '../api/queries';
import { createClassroom, createTeam, joinClassroom, joinExistingTeam } from '../api/service';
import { deleteClassroomMutation } from '../api/mutations';
import type { ClassroomRecord } from '../api/types';

const classSchema = z.object({
  name: z.string().trim().min(3, 'Tên lớp cần ít nhất 3 ký tự')
});
const teamSchema = z.object({
  name: z.string().trim().min(2, 'Tên nhóm cần ít nhất 2 ký tự'),
  description: z.string().trim().max(160),
  capacity: z.number().min(2).max(10)
});
type ClassValues = z.infer<typeof classSchema>;
type TeamValues = z.infer<typeof teamSchema>;

export function TeacherDatabaseClasses() {
  const [open, setOpen] = useState(false);
  const [classroomToDelete, setClassroomToDelete] = useState<ClassroomRecord | null>(null);
  const queryClient = useQueryClient();
  const { data = [], isPending, error } = useQuery({ ...classroomsQueryOptions(), retry: false });
  const mutation = useMutation({
    mutationFn: createClassroom,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classroomKeys.all })
  });
  const deleteMutation = useMutation(deleteClassroomMutation);
  const { FormTextField } = useFormFields<ClassValues>();
  const form = useAppForm({
    defaultValues: { name: '' } as ClassValues,
    validators: { onSubmit: classSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ ...value, description: '' });
      form.reset();
      setOpen(false);
      toast.success('Tạo lớp thành công');
    }
  });
  if (isPending) return <Skeleton className='h-64 w-full' />;
  if (error) return <p className='text-destructive'>{error.message}</p>;
  return (
    <>
      <div className='mb-4 flex justify-end'>
        <Button onClick={() => setOpen(true)}>
          <Icons.add data-icon='inline-start' />
          Tạo lớp
        </Button>
      </div>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(17rem,20rem))]'>
        {data.map((item) => (
          <Card
            key={item.id}
            size='sm'
            className='w-full transition-[box-shadow,transform] motion-safe:hover:-translate-y-0.5 hover:shadow-md'
          >
            <CardHeader className='grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <Icons.workspace className='size-5' aria-hidden='true' />
              </div>
              <CardTitle className='truncate text-base'>{item.name}</CardTitle>
              <Badge variant='secondary' className='text-xs'>
                {item.canManage ? 'Lớp của bạn' : 'Chỉ xem'}
              </Badge>
            </CardHeader>
            <CardContent className='flex items-center justify-between gap-3 border-t pt-3'>
              <span className='text-xs text-muted-foreground'>Quản lý bài tập & checkpoint</span>
              <div className='flex items-center gap-2'>
                {item.canManage ? (
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={`Xóa lớp ${item.name}`}
                    onClick={() => setClassroomToDelete(item)}
                  >
                    <Icons.trash className='text-destructive' aria-hidden='true' />
                  </Button>
                ) : null}
                <Button
                  variant='outline'
                  size='sm'
                  render={
                    <Link aria-label={`Mở lớp ${item.name}`} href={`/teacher/classes/${item.id}`} />
                  }
                >
                  {item.canManage ? 'Quản lý' : 'Xem lớp'}
                  <Icons.arrowRight aria-hidden='true' />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo lớp học mới</DialogTitle>
            <DialogDescription>Lớp sẽ xuất hiện trên dashboard học sinh.</DialogDescription>
          </DialogHeader>
          <form.AppForm>
            <form.Form id='db-class-form' className='p-0'>
              <FormTextField name='name' label='Tên lớp' required />
            </form.Form>
          </form.AppForm>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type='submit' form='db-class-form' disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang tạo...' : 'Tạo lớp'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={classroomToDelete !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen && !deleteMutation.isPending) setClassroomToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa lớp {classroomToDelete?.name}?</DialogTitle>
            <DialogDescription>
              Toàn bộ học sinh, khóa học, bài tập, nhóm và tiến độ trong lớp sẽ bị xóa vĩnh viễn.
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              disabled={deleteMutation.isPending}
              onClick={() => setClassroomToDelete(null)}
            >
              Hủy
            </Button>
            <Button
              variant='destructive'
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!classroomToDelete) return;
                deleteMutation.mutate(classroomToDelete.id, {
                  onSuccess: () => {
                    toast.success('Đã xóa lớp học.');
                    setClassroomToDelete(null);
                  },
                  onError: (deleteError) => toast.error(deleteError.message)
                });
              }}
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function StudentDatabaseClasses() {
  const queryClient = useQueryClient();
  const { data = [], isPending, error } = useQuery({ ...classroomsQueryOptions(), retry: false });
  const mutation = useMutation({
    mutationFn: joinClassroom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.all });
      toast.success('Đã tham gia lớp.');
    },
    onError: (joinError) => toast.error(joinError.message)
  });
  if (isPending) return <Skeleton className='h-64 w-full' />;
  if (error) return <p className='text-destructive'>{error.message}</p>;
  return (
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(17rem,20rem))]'>
      {data.map((item) => (
        <Card
          key={item.id}
          size='sm'
          className='w-full transition-[box-shadow,transform] motion-safe:hover:-translate-y-0.5 hover:shadow-md'
        >
          <CardHeader className='grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3'>
            <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <Icons.workspace className='size-5' aria-hidden='true' />
            </div>
            <CardTitle className='truncate text-base'>{item.name}</CardTitle>
            <Badge variant={item.joined ? 'secondary' : 'outline'} className='text-xs'>
              {item.joined ? 'Đã tham gia' : 'Đang mở'}
            </Badge>
          </CardHeader>
          <CardContent className='flex items-center justify-between border-t pt-3'>
            <span className='text-xs text-muted-foreground'>Bài tập & nhóm học tập</span>
            {item.joined ? (
              <Button
                variant='outline'
                size='sm'
                render={
                  <Link aria-label={`Vào lớp ${item.name}`} href={`/student/classes/${item.id}`} />
                }
              >
                Vào lớp
                <Icons.arrowRight aria-hidden='true' />
              </Button>
            ) : (
              <Button
                size='sm'
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(item.id)}
              >
                Tham gia lớp
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DatabaseClassWorkspace({ classId }: { classId: string }) {
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: classes = [] } = useQuery(classroomsQueryOptions());
  const classroom = classes.find((item) => item.id === classId);
  const { data: teams = [], isPending } = useQuery({
    ...classroomTeamsQueryOptions(classId),
    enabled: !!classroom?.joined
  });
  const createMutation = useMutation({
    mutationFn: (value: TeamValues) => createTeam(classId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classroomKeys.teams(classId) })
  });
  const joinMutation = useMutation({
    mutationFn: (teamId: string) => joinExistingTeam(classId, teamId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classroomKeys.teams(classId) })
  });
  const { FormTextField, FormTextareaField } = useFormFields<TeamValues>();
  const form = useAppForm({
    defaultValues: { name: '', description: '', capacity: 5 } as TeamValues,
    validators: { onSubmit: teamSchema },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync(value);
      form.reset();
      setOpen(false);
      toast.success('Tạo nhóm thành công. Bạn là trưởng nhóm.');
    }
  });
  if (!classroom) return <Skeleton className='h-48 w-full' />;
  if (!classroom.joined)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bạn chưa tham gia lớp</CardTitle>
        </CardHeader>
      </Card>
    );
  const ownTeam = teams.find((team) => team.memberIds.includes(user?.id ?? ''));
  if (isPending) return <Skeleton className='h-48 w-full' />;
  return (
    <div className='flex flex-col gap-4'>
      {ownTeam ? (
        <Card>
          <CardHeader>
            <CardTitle>{ownTeam.name}</CardTitle>
            <CardDescription>{ownTeam.description}</CardDescription>
            <CardAction>
              <Badge variant='secondary'>
                {ownTeam.leaderId === user?.id ? 'Bạn là trưởng nhóm' : 'Thành viên'}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {ownTeam.memberIds.length}/{ownTeam.capacity} thành viên
          </CardContent>
        </Card>
      ) : (
        <>
          <Button className='self-start' onClick={() => setOpen(true)}>
            <Icons.add data-icon='inline-start' />
            Tạo nhóm
          </Button>
          <div className='grid gap-4 md:grid-cols-2'>
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>{team.description}</CardDescription>
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
                    Tham gia nhóm
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo nhóm</DialogTitle>
            <DialogDescription>Người tạo nhóm tự động trở thành trưởng nhóm.</DialogDescription>
          </DialogHeader>
          <form.AppForm>
            <form.Form id='db-team-form' className='p-0'>
              <FormTextField name='name' label='Tên nhóm' required />
              <FormTextareaField name='description' label='Mô tả' />
              <form.AppField name='capacity'>
                {(field) => (
                  <field.FieldSet>
                    <field.Field>
                      <field.FieldLabel htmlFor={field.name}>Số thành viên tối đa</field.FieldLabel>
                      <input
                        id={field.name}
                        aria-label='Số thành viên tối đa'
                        className='border-input h-9 w-full rounded-md border px-3'
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
            <Button type='submit' form='db-team-form' disabled={createMutation.isPending}>
              Tạo nhóm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function TeacherDatabaseClassDetail({ classId }: { classId: string }) {
  const { data = [], isPending } = useQuery(classroomsQueryOptions());
  if (isPending) return <Skeleton className='h-48 w-full' />;
  const classroom = data.find((item) => item.id === classId);
  if (!classroom) return <p className='text-destructive'>Không tìm thấy lớp học.</p>;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{classroom.name}</CardTitle>
        <CardAction>
          <Badge variant='secondary'>{classroom.canManage ? 'Lớp của bạn' : 'Chỉ xem'}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {classroom.canManage
          ? 'Bạn có thể quản lý bài tập và checkpoint của lớp này.'
          : 'Lớp của giáo viên khác. Bạn có thể xem bài tập và tiến độ nhưng không thể chỉnh sửa.'}
      </CardContent>
    </Card>
  );
}
