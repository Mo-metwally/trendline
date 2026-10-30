import { NextRequest, NextResponse } from 'next/server';

async function getApiBridge() {
  const mod = await import('@/src/lib/apiBridge');
  return mod.default || mod;
}

async function handle(request: NextRequest) {
  try {
    const bridge = await getApiBridge();
    return await bridge.handleNextApiRequest(request);
  } catch (err: any) {
    console.error('API Bridge Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Server error', stack: err?.stack },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function PUT(request: NextRequest) {
  return handle(request);
}

export async function PATCH(request: NextRequest) {
  return handle(request);
}

export async function DELETE(request: NextRequest) {
  return handle(request);
}

export async function OPTIONS(request: NextRequest) {
  return handle(request);
}

export async function HEAD(request: NextRequest) {
  return handle(request);
}



