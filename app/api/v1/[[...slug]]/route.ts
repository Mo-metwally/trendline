import { NextRequest } from 'next/server';
const { handleNextApiRequest } = require('../../../../src/lib/apiBridge');

export async function GET(request: NextRequest) {
  return handleNextApiRequest(request);
}

export async function POST(request: NextRequest) {
  return handleNextApiRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleNextApiRequest(request);
}

export async function PATCH(request: NextRequest) {
  return handleNextApiRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleNextApiRequest(request);
}

export async function OPTIONS(request: NextRequest) {
  return handleNextApiRequest(request);
}

export async function HEAD(request: NextRequest) {
  return handleNextApiRequest(request);
}

