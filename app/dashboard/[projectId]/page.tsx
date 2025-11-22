import { redirect } from 'next/navigation';

export default function ProjectDefault({ params }: { params: { projectId: string } }) {
  redirect(`/dashboard/${params.projectId}/ai`);
}
