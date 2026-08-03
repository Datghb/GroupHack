'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
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
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import type { Classroom } from '../domain/types';
import { CLASSROOMS_CHANGED_EVENT, readCustomClassrooms } from '../api/browser-store';

interface StudentTeam {
  id: string;
  classroomId: string;
  name: string;
  description: string;
  leaderId: string;
  memberIds: string[];
  capacity: number;
}

interface StudentState {
  enrollmentIds: string[];
  teams: StudentTeam[];
}

const EMPTY_STATE: StudentState = { enrollmentIds: [], teams: [] };
const teamSchema = z.object({
  name: z.string().trim().min(2, 'Tên nhóm cần ít nhất 2 ký tự'),
  description: z.string().trim().max(160, 'Mô tả không quá 160 ký tự'),
  capacity: z.number().min(2, 'Nhóm cần ít nhất 2 thành viên').max(10, 'Tối đa 10 thành viên')
});
type TeamFormValues = z.infer<typeof teamSchema>;

function storageKey(userId: string): string {
  return `classroom-progress:${userId}`;
}

function readState(userId: string): StudentState {
  if (typeof window === 'undefined') return EMPTY_STATE;
  try {
    const enrollmentValue = window.localStorage.getItem(storageKey(userId));
    const teamsValue = window.localStorage.getItem('classroom-progress:teams');
    const enrollmentState = enrollmentValue
      ? (JSON.parse(enrollmentValue) as Pick<StudentState, 'enrollmentIds'>)
      : { enrollmentIds: [] };
    const teams = teamsValue ? (JSON.parse(teamsValue) as StudentTeam[]) : [];
    return { enrollmentIds: enrollmentState.enrollmentIds, teams };
  } catch {
    return EMPTY_STATE;
  }
}

function persistState(userId: string, nextState: StudentState): void {
  window.localStorage.setItem(
    storageKey(userId),
    JSON.stringify({ enrollmentIds: nextState.enrollmentIds })
  );
  window.localStorage.setItem('classroom-progress:teams', JSON.stringify(nextState.teams));
}

function useStudentState() {
  const { user } = useCurrentUser();
  const userId = user?.id ?? 'student-demo';
  const [state, setState] = useState<StudentState>(EMPTY_STATE);

  useEffect(() => {
    setState(readState(userId));
  }, [userId]);

  const updateState = (updater: (current: StudentState) => StudentState) => {
    setState((current) => {
      const nextState = updater(current);
      persistState(userId, nextState);
      return nextState;
    });
  };

  return { userId, state, updateState };
}

export function StudentClassDashboard({ classrooms }: { classrooms: Classroom[] }) {
  const { state, updateState } = useStudentState();
  const [customClassrooms, setCustomClassrooms] = useState<Classroom[]>([]);

  useEffect(() => {
    const refresh = () => setCustomClassrooms(readCustomClassrooms());
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener(CLASSROOMS_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(CLASSROOMS_CHANGED_EVENT, refresh);
    };
  }, []);

  const visibleClassrooms = [...classrooms, ...customClassrooms];

  const joinClass = (classroomId: string) => {
    if (state.enrollmentIds.includes(classroomId)) return;
    updateState((current) => ({
      ...current,
      enrollmentIds: [...current.enrollmentIds, classroomId]
    }));
    toast.success('Tham gia lớp thành công');
  };

  return (
    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
      {visibleClassrooms.map((classroom) => {
        const joined = state.enrollmentIds.includes(classroom.id);
        return (
          <Card key={classroom.id}>
            <CardHeader>
              <CardTitle>{classroom.name}</CardTitle>
              <CardDescription>{classroom.description}</CardDescription>
              <CardAction>
                <Badge variant={joined ? 'secondary' : 'outline'}>
                  {joined ? 'Đã tham gia' : 'Lớp đang mở'}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground text-sm'>
                {classroom.studentCount} học sinh · {classroom.teamCount} nhóm
              </span>
              {joined ? (
                <Button
                  size='sm'
                  variant='outline'
                  render={
                    <Link
                      aria-label={`Vào lớp ${classroom.name}`}
                      href={`/student/classes/${classroom.id}`}
                    />
                  }
                >
                  Vào lớp
                </Button>
              ) : (
                <Button size='sm' onClick={() => joinClass(classroom.id)}>
                  Tham gia lớp
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function CustomStudentClassFlow({ classId }: { classId: string }) {
  const [classroom, setClassroom] = useState<Classroom>();
  useEffect(() => {
    setClassroom(readCustomClassrooms().find((item) => item.id === classId));
  }, [classId]);

  if (!classroom) {
    return <p className='text-muted-foreground'>Không tìm thấy lớp học hoặc lớp đã bị xóa.</p>;
  }
  return <StudentClassTeamFlow classroom={classroom} />;
}

export function StudentClassTeamFlow({ classroom }: { classroom: Classroom }) {
  const { userId, state, updateState } = useStudentState();
  const [dialogOpen, setDialogOpen] = useState(false);
  const joined = state.enrollmentIds.includes(classroom.id);
  const currentTeam = state.teams.find(
    (team) => team.classroomId === classroom.id && team.memberIds.includes(userId)
  );
  const availableTeams = useMemo(
    () => state.teams.filter((team) => team.classroomId === classroom.id),
    [classroom.id, state.teams]
  );
  const { FormTextField, FormTextareaField } = useFormFields<TeamFormValues>();
  const form = useAppForm({
    defaultValues: { name: '', description: '', capacity: 5 } as TeamFormValues,
    validators: { onSubmit: teamSchema },
    onSubmit: ({ value }) => {
      if (!joined || currentTeam) return;
      const team: StudentTeam = {
        id: crypto.randomUUID(),
        classroomId: classroom.id,
        name: value.name,
        description: value.description,
        capacity: value.capacity,
        leaderId: userId,
        memberIds: [userId]
      };
      updateState((current) => ({ ...current, teams: [...current.teams, team] }));
      form.reset();
      setDialogOpen(false);
      toast.success('Tạo nhóm thành công. Bạn là trưởng nhóm.');
    }
  });

  const joinClass = () => {
    updateState((current) => ({
      ...current,
      enrollmentIds: current.enrollmentIds.includes(classroom.id)
        ? current.enrollmentIds
        : [...current.enrollmentIds, classroom.id]
    }));
    toast.success('Tham gia lớp thành công');
  };

  const joinTeam = (teamId: string) => {
    if (!joined || currentTeam) return;
    updateState((current) => ({
      ...current,
      teams: current.teams.map((team) =>
        team.id === teamId && team.memberIds.length < team.capacity
          ? { ...team, memberIds: [...team.memberIds, userId] }
          : team
      )
    }));
    toast.success('Tham gia nhóm thành công');
  };

  if (!joined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tham gia lớp để bắt đầu</CardTitle>
          <CardDescription>
            Sau khi tham gia, bạn có thể tạo nhóm mới hoặc vào một nhóm đang tuyển thành viên.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={joinClass}>Tham gia lớp</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      {currentTeam ? (
        <Card>
          <CardHeader>
            <CardTitle>{currentTeam.name}</CardTitle>
            <CardDescription>{currentTeam.description || 'Nhóm chưa có mô tả.'}</CardDescription>
            <CardAction>
              <Badge variant='secondary'>
                {currentTeam.leaderId === userId ? 'Bạn là trưởng nhóm' : 'Thành viên'}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className='flex items-center justify-between gap-3'>
            <span className='text-muted-foreground text-sm'>
              {currentTeam.memberIds.length}/{currentTeam.capacity} thành viên
            </span>
            <Button
              variant='outline'
              render={
                <Link
                  aria-label={`Mở nhóm ${currentTeam.name}`}
                  href={`/student/classes/${classroom.id}/teams/${currentTeam.id}`}
                />
              }
            >
              Mở không gian nhóm
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className='flex flex-wrap gap-2'>
            <Button onClick={() => setDialogOpen(true)}>
              <Icons.add data-icon='inline-start' />
              Tạo nhóm
            </Button>
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            {availableTeams.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Chưa có nhóm nào</CardTitle>
                  <CardDescription>
                    Hãy tạo nhóm đầu tiên. Người tạo nhóm sẽ tự động trở thành trưởng nhóm.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              availableTeams.map((team) => {
                const full = team.memberIds.length >= team.capacity;
                return (
                  <Card key={team.id}>
                    <CardHeader>
                      <CardTitle>{team.name}</CardTitle>
                      <CardDescription>{team.description || 'Nhóm chưa có mô tả.'}</CardDescription>
                      <CardAction>
                        <Badge variant='outline'>Đang tuyển</Badge>
                      </CardAction>
                    </CardHeader>
                    <CardContent className='flex items-center justify-between gap-3'>
                      <span className='text-muted-foreground text-sm'>
                        {team.memberIds.length}/{team.capacity} thành viên
                      </span>
                      <Button size='sm' disabled={full} onClick={() => joinTeam(team.id)}>
                        {full ? 'Nhóm đã đầy' : 'Tham gia nhóm'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo nhóm trong lớp {classroom.name}</DialogTitle>
            <DialogDescription>
              Bạn sẽ tự động trở thành trưởng nhóm và có thể mời các bạn khác tham gia.
            </DialogDescription>
          </DialogHeader>
          <form.AppForm>
            <form.Form id='create-team-form' className='p-0'>
              <FormTextField
                name='name'
                label='Tên nhóm'
                placeholder='Ví dụ: Nhóm Sáng tạo'
                required
              />
              <FormTextareaField
                name='description'
                label='Mô tả ngắn'
                placeholder='Mục tiêu hoặc chủ đề của nhóm'
              />
              <form.AppField name='capacity'>
                {(field) => (
                  <field.FieldSet>
                    <field.Field>
                      <field.FieldLabel htmlFor={field.name}>Số thành viên tối đa</field.FieldLabel>
                      <input
                        id={field.name}
                        aria-label='Số thành viên tối đa'
                        className='border-input bg-background h-9 w-full rounded-md border px-3'
                        type='number'
                        min={2}
                        max={10}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(Number(event.target.value))}
                        aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                      />
                    </field.Field>
                    <field.FieldError />
                  </field.FieldSet>
                )}
              </form.AppField>
            </form.Form>
          </form.AppForm>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button type='submit' form='create-team-form'>
              Tạo nhóm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function StudentTeamWorkspace({
  classroomId,
  teamId
}: {
  classroomId: string;
  teamId: string;
}) {
  const { userId, state } = useStudentState();
  const team = state.teams.find((item) => item.id === teamId && item.classroomId === classroomId);

  if (!team) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không tìm thấy nhóm</CardTitle>
          <CardDescription>Nhóm không tồn tại hoặc không thuộc lớp học này.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            render={<Link aria-label='Quay lại lớp học' href={`/student/classes/${classroomId}`} />}
          >
            Quay lại lớp học
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='grid gap-4 md:grid-cols-2'>
      <Card>
        <CardHeader>
          <CardTitle>{team.name}</CardTitle>
          <CardDescription>{team.description || 'Nhóm chưa có mô tả.'}</CardDescription>
          <CardAction>
            <Badge variant='secondary'>
              {team.leaderId === userId ? 'Bạn là trưởng nhóm' : 'Thành viên'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-sm'>
            {team.memberIds.length}/{team.capacity} thành viên
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Quyền của trưởng nhóm</CardTitle>
          <CardDescription>
            Người tạo nhóm đầu tiên được quyền quản lý thành viên và nộp checkpoint nhóm.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant='outline'>
            Trưởng nhóm: {team.leaderId === userId ? 'Bạn' : 'Thành viên khác'}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
