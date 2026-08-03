'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { toast } from 'sonner';
import { z } from 'zod';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { readCustomClassrooms, saveCustomClassrooms } from '../api/browser-store';
import type { Classroom } from '../domain/types';

const classroomSchema = z.object({
  name: z.string().trim().min(3, 'Tên lớp cần ít nhất 3 ký tự')
});
type ClassroomFormValues = z.infer<typeof classroomSchema>;

export function TeacherClassManager({ seededClassrooms }: { seededClassrooms: Classroom[] }) {
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [customClassrooms, setCustomClassrooms] = useState<Classroom[]>([]);
  const { FormTextField } = useFormFields<ClassroomFormValues>();

  useEffect(() => {
    setCustomClassrooms(readCustomClassrooms());
  }, []);

  const form = useAppForm({
    defaultValues: { name: '' } as ClassroomFormValues,
    validators: { onSubmit: classroomSchema },
    onSubmit: ({ value }) => {
      const classroom: Classroom = {
        id: `class-${crypto.randomUUID()}`,
        name: value.name,
        description: '',
        teacherId: user?.id ?? 'teacher-demo',
        archived: false,
        studentCount: 0,
        teamCount: 0
      };
      const nextClassrooms = [...customClassrooms, classroom];
      saveCustomClassrooms(nextClassrooms);
      setCustomClassrooms(nextClassrooms);
      form.reset();
      setOpen(false);
      toast.success('Tạo lớp thành công. Học sinh đã có thể nhìn thấy lớp này.');
    }
  });

  const classrooms = [...seededClassrooms, ...customClassrooms];

  return (
    <>
      <div className='mb-4 flex justify-end'>
        <Button onClick={() => setOpen(true)}>
          <Icons.add data-icon='inline-start' />
          Tạo lớp
        </Button>
      </div>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {classrooms.map((classroom) => (
          <Card key={classroom.id}>
            <CardHeader>
              <CardTitle>{classroom.name}</CardTitle>
              <CardAction>
                <Badge variant='secondary'>Đang mở</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className='flex items-center justify-between gap-3'>
              <div className='text-muted-foreground flex gap-4 text-sm'>
                <span>{classroom.studentCount} học sinh</span>
                <span>{classroom.teamCount} nhóm</span>
              </div>
              <Button
                variant='outline'
                size='sm'
                render={
                  <Link
                    aria-label={`Mở lớp ${classroom.name}`}
                    href={`/teacher/classes/${classroom.id}`}
                  />
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
            <DialogDescription>
              Lớp sẽ xuất hiện ngay trên dashboard của học sinh.
            </DialogDescription>
          </DialogHeader>
          <form.AppForm>
            <form.Form id='create-classroom-form' className='p-0'>
              <FormTextField
                name='name'
                label='Tên lớp'
                placeholder='Ví dụ: Lập trình Web 2026'
                required
              />
            </form.Form>
          </form.AppForm>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type='submit' form='create-classroom-form'>
              Tạo lớp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TeacherCustomClassDetail({ classId }: { classId: string }) {
  const [classroom, setClassroom] = useState<Classroom>();
  useEffect(() => {
    setClassroom(readCustomClassrooms().find((item) => item.id === classId));
  }, [classId]);

  if (!classroom) return <p className='text-muted-foreground'>Không tìm thấy lớp học.</p>;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{classroom.name}</CardTitle>
        <CardAction>
          <Badge variant='secondary'>Đang mở</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className='flex gap-4 text-sm'>
        <span>{classroom.studentCount} học sinh</span>
        <span>{classroom.teamCount} nhóm</span>
      </CardContent>
    </Card>
  );
}
