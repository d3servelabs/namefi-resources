// Magic-link unlock: GET /preview?code=<accessCode>. The access code is
// validated server-side; on match, gate cookies are issued and the response
// redirects to `/` on the same host. In production builds the BUNDLED define
// folds to '0', the dynamic import is unreachable, and the access handler
// module is dead-code-eliminated.
export async function GET(request: Request): Promise<Response> {
  console.log('[preview-gate/preview-route] GET', {
    bundled: process.env.NEXT_PUBLIC_PREVIEW_GATE_BUNDLED,
  });
  if (process.env.NEXT_PUBLIC_PREVIEW_GATE_BUNDLED !== '1') {
    console.log('[preview-gate/preview-route] not bundled -> 404');
    return new Response(null, { status: 404 });
  }
  const { handleAccess } = await import('@/lib/preview-gate/handle-access');
  return handleAccess(request);
}
