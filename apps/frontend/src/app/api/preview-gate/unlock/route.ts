// In production builds (`compiler.define` substitutes
// `process.env.NEXT_PUBLIC_PREVIEW_GATE_BUNDLED` to '0') the equality folds
// to `false`, the dynamic `import(...)` is unreachable, and the entire
// preview-gate handler module graph is dead-code-eliminated. Only the 404
// short-circuit remains.
export async function POST(request: Request): Promise<Response> {
  if (process.env.NEXT_PUBLIC_PREVIEW_GATE_BUNDLED !== '1') {
    return new Response(null, { status: 404 });
  }
  const { handleUnlock } = await import('@/lib/preview-gate/handle-unlock');
  return handleUnlock(request);
}
