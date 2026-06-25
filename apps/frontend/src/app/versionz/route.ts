import { createVersionJsonResponse } from '@/lib/version-info';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  return createVersionJsonResponse();
}
