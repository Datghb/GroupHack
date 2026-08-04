import { NextResponse } from 'next/server';
import { getApiAuth } from '@/lib/api-auth';
import { getStudentOverviewData } from '@/features/classroom/api/student-overview';

export async function GET() {
  const { userId, role } = await getApiAuth();
  if (!userId) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
  if (role !== 'STUDENT')
    return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 });
  try {
    return NextResponse.json({ data: await getStudentOverviewData(userId) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Không thể tải tổng quan.' },
      { status: 500 }
    );
  }
}
