'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { PasswordInput } from '@/components/password-input';

const LOG_PREFIX = '[preview-gate/form]';
const QUERY_PARAM = 'access-code';

function stripAccessCodeFromUrl() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(QUERY_PARAM)) return;
  url.searchParams.delete(QUERY_PARAM);
  window.history.replaceState(
    null,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
}

export function PreviewGateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accessCode, setAccessCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const autoSubmittedRef = useRef(false);

  const submitCode = useCallback(
    async (code: string) => {
      console.log(LOG_PREFIX, 'submit', { accessCodeLength: code.length });
      setSubmitting(true);
      try {
        const res = await fetch('/api/preview-gate/unlock', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ accessCode: code }),
        });
        console.log(LOG_PREFIX, 'response', {
          status: res.status,
          ok: res.ok,
        });
        if (res.ok) {
          console.log(LOG_PREFIX, 'unlocked, refreshing');
          router.refresh();
          return;
        }
        toast.error('Incorrect access code', {
          description: 'Check the access code and try again.',
        });
        setAccessCode('');
      } catch (err) {
        console.log(LOG_PREFIX, 'fetch error', err);
        toast.error('Unable to verify access code', {
          description: 'Please try again in a moment.',
        });
      } finally {
        setSubmitting(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (autoSubmittedRef.current) return;
    const fromQuery = searchParams.get(QUERY_PARAM);
    if (!fromQuery) return;
    autoSubmittedRef.current = true;
    console.log(LOG_PREFIX, 'auto-submit from query', {
      accessCodeLength: fromQuery.length,
    });
    setAccessCode(fromQuery);
    stripAccessCodeFromUrl();
    void submitCode(fromQuery);
  }, [searchParams, submitCode]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void submitCode(accessCode);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Preview access</CardTitle>
          <CardDescription>
            Enter the access code to access this preview environment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="preview-gate-access-code">Access code</Label>
              <PasswordInput
                id="preview-gate-access-code"
                autoFocus
                autoComplete="current-password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                disabled={submitting}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || accessCode.length === 0}
            >
              Unlock
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
