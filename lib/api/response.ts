import { NextResponse } from "next/server";

type ApiError = {
  code: string;
  message: string;
};

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, error: null, meta: meta ?? null });
}

export function fail(
  code: string,
  message: string,
  status = 400
) {
  const error: ApiError = { code, message };
  return NextResponse.json({ data: null, error, meta: null }, { status });
}
