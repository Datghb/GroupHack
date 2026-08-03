import { redirect } from 'next/navigation';

export default async function CheckpointPage({
  params
}: {
  params: Promise<{ classId: string; assignmentId: string }>;
}) {
  const { classId, assignmentId } = await params;
  redirect(`/student/classes/${classId}/assignments/${assignmentId}`);
}
