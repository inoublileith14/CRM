import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function WorkerEditRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/dashboard/usuarios/${id}/edit`);
}
