import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function canAccessClassroom(
  userId: string,
  role: 'TEACHER' | 'STUDENT' | null,
  classId: string
): Promise<boolean> {
  const db = getSupabaseAdmin();
  if (role === 'TEACHER') {
    const { data } = await db
      .from('classrooms')
      .select('id')
      .eq('id', classId)
      .eq('teacher_id', userId)
      .maybeSingle();
    return Boolean(data);
  }
  const { data } = await db
    .from('class_enrollments')
    .select('id')
    .eq('classroom_id', classId)
    .eq('student_id', userId)
    .maybeSingle();
  return Boolean(data);
}

export async function canAccessAssignment(
  userId: string,
  role: 'TEACHER' | 'STUDENT' | null,
  classId: string,
  assignmentId: string
): Promise<boolean> {
  if (!(await canAccessClassroom(userId, role, classId))) return false;
  const db = getSupabaseAdmin();
  const { data } = await db
    .from('assignments')
    .select('id,course_id')
    .eq('id', assignmentId)
    .eq('classroom_id', classId)
    .maybeSingle();
  if (!data) return false;
  if (role === 'TEACHER') return true;
  const { data: enrollment } = await db
    .from('class_enrollments')
    .select('course_id')
    .eq('classroom_id', classId)
    .eq('student_id', userId)
    .maybeSingle();
  return Boolean(enrollment && enrollment.course_id === data.course_id);
}
