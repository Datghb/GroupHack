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

const classSchema = z.object({
  name: z.string().trim().min(3, 'Tên lớp cần ít nhất 3 ký tự'),
  description: z.string().trim().max(240, 'Mô tả không quá 240 ký tự')
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
  const queryClient = useQueryClient();
  const { data = [], isPending, error } = useQuery({ ...classroomsQueryOptions(), retry: false });
  const mutation = useMutation({
    mutationFn: createClassroom,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classroomKeys.all })
  });
  const { FormTextField, FormTextareaField } = useFormFields<ClassValues>();
  const form = useAppForm({
    defaultValues: { name: '', description: '' } as ClassValues,
    validators: { onSubmit: classSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
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
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {data.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
              <CardDescription>{item.description || 'Lớp chưa có mô tả.'}</CardDescription>
              <CardAction>
                <Badge variant='secondary'>Đang mở</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Button
                variant='outline'
                render={
                  <Link aria-label={`Mở lớp ${item.name}`} href={`/teacher/classes/${item.id}`} />
                }
              >
                Mở lớp
              </Button>
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
              <FormTextareaField name='description' label='Mô tả (không bắt buộc)' />
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
    </>
  );
}

export function StudentDatabaseClasses() {
  const queryClient = useQueryClient();
  const { data = [], isPending, error } = useQuery({ ...classroomsQueryOptions(), retry: false });
  const mutation = useMutation({
    mutationFn: joinClassroom,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: classroomKeys.all })
  });
  if (isPending) return <Skeleton className='h-64 w-full' />;
  if (error) return <p className='text-destructive'>{error.message}</p>;
  return (
    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
      {data.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle>{item.name}</CardTitle>
            <CardDescription>{item.description || 'Lớp chưa có mô tả.'}</CardDescription>
            <CardAction>
              <Badge variant={item.joined ? 'secondary' : 'outline'}>
                {item.joined ? 'Đã tham gia' : 'Lớp đang mở'}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            {item.joined ? (
              <Button
                variant='outline'
                render={
                  <Link aria-label={`Vào lớp ${item.name}`} href={`/student/classes/${item.id}`} />
                }
              >
                Vào lớp
              </Button>
            ) : (
              <Button disabled={mutation.isPending} onClick={() => mutation.mutate(item.id)}>
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
        <CardDescription>{classroom.description || 'Lớp chưa có mô tả.'}</CardDescription>
        <CardAction>
          <Badge variant='secondary'>Đang mở</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>Học sinh có thể nhìn thấy và tham gia lớp này.</CardContent>
    </Card>
  );
}
