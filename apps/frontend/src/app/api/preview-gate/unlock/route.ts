// In production builds (`compiler.define` substitutes
// `__NAMEFI_PREVIEW_GATE_BUNDLED__` to `false`) the branch folds
// to `false`, the dynamic `import(...)` is unreachable, and the entire
// preview-gate handler module graph is dead-code-eliminated. Only the 404
// short-circuit remains.
export async function POST(request: Request): Promise<Response> {
  console.log('[preview-gate/route] POST', {
    bundled: __NAMEFI_PREVIEW_GATE_BUNDLED__,
  });
  if (!__NAMEFI_PREVIEW_GATE_BUNDLED__) {
    console.log('[preview-gate/route] not bundled -> 404');
    return new Response(null, { status: 404 });
  }
  const { handleUnlock } = await import('@/lib/preview-gate/handle-unlock');
  return handleUnlock(request);
}
