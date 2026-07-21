import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_PAGE_SIZE = 1000;

type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<PageResult<T>>,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<{ data: T[]; error: string | null }> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) return { data: [], error: error.message };
    if (!data?.length) break;

    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return { data: rows, error: null };
}

export async function upsertAllPages<T extends Record<string, unknown>, R>(
  admin: SupabaseClient,
  table: string,
  rows: T[],
  options: {
    onConflict: string;
    ignoreDuplicates?: boolean;
    select: string;
  },
  pageSize = DEFAULT_PAGE_SIZE
): Promise<{ data: R[]; error: string | null }> {
  const inserted: R[] = [];

  for (let i = 0; i < rows.length; i += pageSize) {
    const batch = rows.slice(i, i + pageSize);
    const { data, error } = await admin
      .from(table)
      .upsert(batch, {
        onConflict: options.onConflict,
        ignoreDuplicates: options.ignoreDuplicates,
      })
      .select(options.select);

    if (error) return { data: [], error: error.message };
    if (data) inserted.push(...(data as R[]));
  }

  return { data: inserted, error: null };
}
