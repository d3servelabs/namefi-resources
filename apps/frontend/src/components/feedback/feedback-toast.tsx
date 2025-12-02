'use client';

import { Button } from '@/components/ui/shadcn/button';
import { Card } from '@/components/ui/shadcn/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from '@/components/ui/shadcn/form';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { useTRPC } from '@/lib/trpc';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Loader2, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '@/lib/cn';

const ratingOptions = [
  { value: 1, label: 'Not good', emoji: '😫' },
  { value: 2, label: 'Meh', emoji: '🙁' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Nice', emoji: '🙂' },
  { value: 5, label: 'Loved it', emoji: '🤩' },
] as const;

const feedbackFormSchema = z.object({
  message: z
    .string()
    .trim()
    .max(2000, 'Keep it under 2000 characters.')
    .optional(),
});

export type FeedbackToastCopy = {
  title: string;
  description: string;
  placeholder?: string;
};

type FeedbackToastContentProps = {
  toastId: string | number;
  copy?: FeedbackToastCopy;
  initialRating?: number | null;
  initialMessage?: string | null;
  initialFeedbackId?: string | null;
  onSavedAction: (payload: {
    id: string;
    rating: number;
    message?: string | null;
    submittedAt: string;
  }) => void;
  onDismissAction: () => void;
  onShownAction?: (shownAtIso: string) => void;
};

export function FeedbackToastContent({
  toastId,
  copy,
  initialRating = null,
  initialMessage = '',
  initialFeedbackId = null,
  onSavedAction,
  onDismissAction,
  onShownAction,
}: FeedbackToastContentProps) {
  const pathname = usePathname();
  const trpc = useTRPC();
  const [rating, setRating] = useState<number | null>(initialRating);
  const [feedbackId, setFeedbackId] = useState<string | null>(
    initialFeedbackId,
  );

  const form = useForm<z.infer<typeof feedbackFormSchema>>({
    resolver: zodResolver(feedbackFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      message: initialMessage ?? '',
    },
  });

  const {
    watch,
    formState: { isValid },
  } = form;
  const messageValue = watch('message') ?? '';

  const submitFeedback = useMutation({
    ...trpc.feedback.submit.mutationOptions({
      onError: (error) => {
        toast.error(error.message ?? 'Unable to save feedback right now.');
      },
    }),
  });

  const handleSaved = (
    result: {
      id?: string | null;
      message?: string | null;
      createdAt?: Date | null;
    },
    savedRating: number,
  ) => {
    const submittedAt =
      result.createdAt instanceof Date
        ? result.createdAt.toISOString()
        : new Date().toISOString();
    const idToPersist = result.id ?? feedbackId;
    if (idToPersist) {
      setFeedbackId(idToPersist);
      onSavedAction({
        id: idToPersist,
        rating: savedRating,
        message: result.message ?? messageValue ?? null,
        submittedAt,
      });
    }
  };

  const handleRatingSelect = async (value: number) => {
    setRating(value);
    const result = await submitFeedback.mutateAsync({
      rating: value,
      feedbackId: feedbackId ?? undefined,
      path: pathname ?? undefined,
    });
    handleSaved(result ?? {}, value);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!rating) {
      toast.error('Choose a rating first.');
      return;
    }
    const result = await submitFeedback.mutateAsync({
      rating,
      message: values.message,
      feedbackId: feedbackId ?? undefined,
      path: pathname ?? undefined,
    });
    handleSaved(result ?? {}, rating);
    toast.success('Thanks for the feedback!');
    toast.dismiss(toastId);
  });

  const showMessageField = useMemo(() => Boolean(rating), [rating]);
  const canSubmit =
    Boolean(rating) &&
    Boolean(messageValue.trim().length) &&
    isValid &&
    !submitFeedback.isPending;

  useEffect(() => {
    if (onShownAction) {
      onShownAction(new Date().toISOString());
    }
  }, [onShownAction]);

  const safeCopy: FeedbackToastCopy = useMemo(() => {
    if (copy) return copy;
    return {
      title: 'Share feedback',
      description: 'Tell us how we are doing.',
      placeholder: 'Your feedback...',
    };
  }, [copy]);

  return (
    <Card className="pointer-events-auto w-full max-w-md rounded-2xl border border-border/80 bg-background/90 p-4 shadow-2xl ring-1 ring-black/10 backdrop-blur gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {safeCopy.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {safeCopy.description}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => {
            onDismissAction();
            toast.dismiss(toastId);
          }}
          aria-label="Close feedback"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {ratingOptions.map((option) => {
          const isActive = option.value === rating;
          return (
            <Button
              key={option.value}
              type="button"
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRatingSelect(option.value)}
              aria-pressed={isActive}
              className={cn(
                'flex h-12 flex-col items-center justify-center rounded-xl text-sm font-medium transition-all sm:h-14',
                isActive
                  ? 'border-brand-primary bg-brand-primary/90 text-secondary-foreground'
                  : '',
              )}
              disabled={submitFeedback.isPending}
            >
              <span className="text-xl leading-none sm:text-2xl">
                {option.emoji}
              </span>
            </Button>
          );
        })}
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-3">
          {showMessageField ? (
            <>
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder={
                          safeCopy.placeholder ??
                          'Tell us what resonated, what was confusing, or what you want next.'
                        }
                        disabled={submitFeedback.isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    onDismissAction();
                    toast.dismiss(toastId);
                  }}
                  disabled={submitFeedback.isPending}
                >
                  Skip
                </Button>
                <Button type="submit" disabled={!canSubmit}>
                  {submitFeedback.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              </div>
            </>
          ) : null}
        </form>
      </Form>
    </Card>
  );
}
