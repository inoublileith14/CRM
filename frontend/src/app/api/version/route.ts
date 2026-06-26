import { NextResponse } from 'next/server';
import { getServerBuildId } from '@/lib/build-id';

export async function GET() {
  return NextResponse.json(
    { buildId: getServerBuildId() },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
