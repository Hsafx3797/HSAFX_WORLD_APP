/**
 * Standardised admin API response helpers.
 *
 * All admin routes should prefer these over raw NextResponse.json()
 * to keep the envelope shape consistent across GET, POST, PATCH, DELETE.
 *
 * Success shape:
 *   { success: true, data: T }
 *   { success: true, data: T[], page, limit, total, totalPages }  (paginated)
 *
 * Error shape:
 *   { success: false, error: { code: string, message: string } }
 */

import { NextResponse } from 'next/server';

/* ── Success ─────────────────────────────────────────────────── */

export function adminResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/* ── Paginated success ───────────────────────────────────────── */

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export function adminPaginatedResponse<T>(
  data: T[],
  { page, limit, total }: PaginationMeta,
  status = 200,
) {
  return NextResponse.json(
    {
      success: true,
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    { status },
  );
}

/* ── Error ───────────────────────────────────────────────────── */

export function adminErrorResponse(code: string, message: string, status = 500) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status },
  );
}
