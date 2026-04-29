'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
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

export function PreviewGateForm() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/preview-gate/unlock', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: input }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      toast.error('Incorrect password', {
        description: 'Check the password and try again.',
      });
      setInput('');
    } catch {
      toast.error('Unable to verify password', {
        description: 'Please try again in a moment.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Preview access</CardTitle>
          <CardDescription>
            Enter the password to access this preview environment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="preview-gate-password">Password</Label>
              <PasswordInput
                id="preview-gate-password"
                autoFocus
                autoComplete="current-password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={submitting}
              />
            </div>
            <Button type="submit" disabled={submitting || input.length === 0}>
              Unlock
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
