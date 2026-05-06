import { vi } from "vitest";

// ─── Types ─────────────────────────────────────────────────────────────────
export interface MockSupabaseConfig {
  user?: { id: string; email: string } | null;
  singleData?: Record<string, unknown> | null;
  singleError?: string | null;
  manyData?: unknown[];
  manyError?: string | null;
  insertData?: Record<string, unknown> | null;
  insertError?: string | null;
  updateData?: Record<string, unknown> | null;
  updateError?: string | null;
  deleteError?: string | null;
  rpcError?: string | null;
}

// ─── Factory ────────────────────────────────────────────────────────────────
export function createSupabaseMock(cfg: MockSupabaseConfig = {}) {
  const {
    user = null,
    singleData = null,
    singleError = null,
    manyData = [],
    manyError = null,
    insertData = { id: "generated-id" },
    insertError = null,
    updateData = null,
    updateError = null,
    deleteError = null,
    rpcError = null,
  } = cfg;

  const singleResult = { data: singleData, error: singleError ? { message: singleError } : null };
  const manyResult = { data: manyData, error: manyError ? { message: manyError } : null };
  const insertResult = { data: insertData, error: insertError ? { message: insertError } : null };
  const updateResult = { data: updateData, error: updateError ? { message: updateError } : null };
  const deleteResult = { error: deleteError ? { message: deleteError } : null };
  const rpcResult = { error: rpcError ? { message: rpcError } : null };

  // A minimal fluent query builder that covers common patterns
  const single = vi.fn().mockResolvedValue(singleResult);

  const terminalMany = vi.fn().mockResolvedValue(manyResult);

  const limitChain = { ...manyResult, limit: terminalMany };

  const orderChain = {
    ...manyResult,
    limit: terminalMany,
    single,
  };

  const eqChain: Record<string, unknown> = {
    ...singleResult,
    single,
    order: vi.fn().mockReturnValue(orderChain),
    limit: terminalMany,
  };
  // allow double .eq() chaining
  eqChain["eq"] = vi.fn().mockReturnValue({
    ...singleResult,
    single,
    select: vi.fn().mockReturnValue({ single }),
  });
  eqChain["in"] = vi.fn().mockReturnValue({ ...manyResult });

  const selectChain = {
    ...manyResult,
    single,
    eq: vi.fn().mockReturnValue(eqChain),
    order: vi.fn().mockReturnValue(orderChain),
    limit: terminalMany,
    in: vi.fn().mockReturnValue({ ...manyResult, eq: vi.fn().mockResolvedValue(manyResult) }),
  };

  const insertChain = {
    ...insertResult,
    select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue(insertResult) }),
    single: vi.fn().mockResolvedValue(insertResult),
  };

  const updateChain = {
    ...updateResult,
    eq: vi.fn().mockReturnValue({
      ...updateResult,
      eq: vi.fn().mockReturnValue({
        ...updateResult,
        select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue(updateResult) }),
      }),
      select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue(updateResult) }),
    }),
  };

  const deleteChain = {
    ...deleteResult,
    eq: vi.fn().mockReturnValue({
      ...deleteResult,
      eq: vi.fn().mockResolvedValue(deleteResult),
    }),
    in: vi.fn().mockReturnValue({ ...deleteResult, eq: vi.fn().mockResolvedValue(deleteResult) }),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      admin: {
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
      },
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue(selectChain),
      insert: vi.fn().mockReturnValue(insertChain),
      update: vi.fn().mockReturnValue(updateChain),
      delete: vi.fn().mockReturnValue(deleteChain),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
    rpc: vi.fn().mockResolvedValue(rpcResult),
  };
}
