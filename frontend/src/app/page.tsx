import { cookies } from 'next/headers';
import { AuthHashRedirect } from '@/components/AuthHashRedirect';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('cocount_token');

  return (
    <AuthHashRedirect fallbackPath={token ? '/dashboard' : '/login'} />
  );
}
