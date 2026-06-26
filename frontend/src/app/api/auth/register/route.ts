import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'El registro público está deshabilitado',
      code: 'REGISTRATION_DISABLED',
    },
    { status: 403 },
  );
}
