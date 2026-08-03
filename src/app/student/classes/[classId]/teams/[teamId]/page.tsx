import { redirect } from 'next/navigation';

export default async function LegacyTeamPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  redirect(`/student/classes/${classId}`);
}
