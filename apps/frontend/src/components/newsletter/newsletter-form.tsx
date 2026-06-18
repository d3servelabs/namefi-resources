'use client';

import { useRef, useState, useMemo, forwardRef, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import { z } from 'zod';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { useTRPC } from '@/lib/trpc';
import { cn } from '@namefi-astra/ui/lib/cn';
import { toast } from 'sonner';
import { Mail, CheckCircle2, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import type {
  AltchaWidgetRef,
  AltchaVerifierRef,
  AltchaProps,
} from './altcha-verifier';
import { useIsClient } from 'usehooks-ts';

const AltchaVerifierDynamic = dynamic(() => import('./altcha-verifier'), {
  ssr: false,
  loading: () => <div className="h-12 rounded-md bg-muted animate-pulse" />,
});

const AltchaVerifier = forwardRef<AltchaVerifierRef, AltchaProps>(
  (props, ref) => (
    <AltchaVerifierDynamic {...props} ref={ref as unknown as never} />
  ),
);

const newsletterFormSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  name: z.string().optional(),
});

interface NewsletterFormProps {
  /**
   * Source identifier for analytics (e.g., 'namefi-home', 'namefi-park', 'newsletter-page')
   */
  from: string;
  /**
   * Optional title for the form
   */
  title?: string;
  /**
   * Optional description for the form
   */
  description?: string;
  /**
   * Whether to show the name field
   */
  showNameField?: boolean;
  /**
   * Variant of the form
   */
  variant?: 'default' | 'minimal';
  /**
   * Additional custom attributes to store with the subscriber
   */
  attributes?: Record<string, unknown>;
  /**
   * Whether to show the close button (X) in the top-left corner
   */
  showCloseButton?: boolean;
  /**
   * Callback function when the close button is clicked
   */
  onClose?: () => void;
  /**
   * Optional class names for styling the outer card container
   */
  className?: string;
  /**
   * Optional class names for the card header
   */
  headerClassName?: string;
  /**
   * Optional class names for the card content
   */
  contentClassName?: string;
}

export function NewsletterForm({
  title = 'Stay Updated',
  description = 'Subscribe to our newsletter for the latest updates and announcements.',
  showNameField = true,
  variant = 'default',
  showCloseButton = false,
  ...props
}: NewsletterFormProps) {
  const isClient = useIsClient();
  if (!isClient) {
    return null;
  }
  return (
    <NewsletterFormInner
      title={title}
      description={description}
      showNameField={showNameField}
      variant={variant}
      showCloseButton={showCloseButton}
      {...props}
    />
  );
}

function NewsletterFormInner({
  from,
  title,
  description,
  showNameField,
  variant,
  attributes,
  showCloseButton,
  onClose,
  className,
  headerClassName,
  contentClassName,
}: NewsletterFormProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const trpc = useTRPC();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const validationResult = useMemo(() => {
    return newsletterFormSchema.safeParse({
      email,
      name,
    });
  }, [email, name]);

  const errors = useMemo(() => {
    return validationResult.error
      ? z.treeifyError(validationResult.error)
      : undefined;
  }, [validationResult]);

  const emailError =
    hasAttemptedSubmit && !validationResult.success && errors
      ? errors?.properties?.email?.errors?.[0]
      : undefined;

  const subscribeMutation = useMutation(
    trpc.newsletter.subscribe.mutationOptions({
      onSuccess: (data) => {
        setIsSuccess(true);
        setEmail('');
        setName('');
        setHasAttemptedSubmit(false);
        toast.success('Subscribed!', {
          description: data.message,
        });
        setTimeout(() => {
          setIsSuccess(false);
          onClose?.();
        }, 5000);
      },
      onError: (error) => {
        if (error.message.includes('already subscribed')) {
          toast.info('Already Subscribed', {
            description: "You're already on our mailing list!",
          });
        } else {
          toast.error('Subscription Failed', {
            description: error.message || 'Please try again later.',
          });
        }
      },
    }),
  );
  const altchaRef = useRef<{
    value: string | null;
    widget: AltchaWidgetRef | null;
  }>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (subscribeMutation.isPending) return;

    setHasAttemptedSubmit(true);
    const parsed = newsletterFormSchema.safeParse({ email, name });
    if (!parsed.success) return;

    subscribeMutation.mutate({
      email: parsed.data.email,
      name: parsed.data.name || undefined,
      from,
      attributes,
      altcha: altchaRef.current?.value,
    });
  };

  const cardClassName = cn('relative mx-auto w-full max-w-2xl', className);
  const successContentClassName = cn('pt-6', contentClassName);

  if (isSuccess) {
    return (
      <Card className={cardClassName}>
        {showCloseButton && onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute -top-2 -left-2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background border border-border shadow-lg"
            aria-label="Close newsletter form"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <CardContent className={successContentClassName}>
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Thanks for subscribing!</h3>
              <p className="text-muted-foreground">
                Please check your email to confirm your subscription.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsSuccess(false)}
              className="mt-4"
            >
              Subscribe with another email
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'minimal') {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-2 w-full max-w-md mx-auto"
      >
        <div className="flex-1">
          <Input
            placeholder="Enter your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={subscribeMutation.isPending}
            aria-invalid={Boolean(emailError)}
          />
          {emailError && (
            <p className="text-destructive text-sm mt-1">{emailError}</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={subscribeMutation.isPending}
          className="shrink-0"
        >
          {subscribeMutation.isPending ? (
            'Subscribing...'
          ) : (
            <>
              <Mail className="w-4 h-4 me-2" />
              Subscribe
            </>
          )}
        </Button>
      </form>
    );
  }

  return (
    <Card className={cardClassName}>
      {showCloseButton && onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute -top-2 -left-2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background border border-border shadow-lg"
          aria-label="Close newsletter form"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <CardHeader className={cn(headerClassName)}>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={cn(contentClassName)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {showNameField && (
            <div className="grid gap-2">
              <Label htmlFor="newsletter-name">Name (optional)</Label>
              <Input
                id="newsletter-name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={subscribeMutation.isPending}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="newsletter-email">Email</Label>
            <Input
              id="newsletter-email"
              placeholder="your@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={subscribeMutation.isPending}
              aria-invalid={Boolean(emailError)}
            />
            {emailError && (
              <p className="text-destructive text-sm">{emailError}</p>
            )}
          </div>

          <AltchaVerifier ref={altchaRef} expire={120_000} />

          <Button
            type="submit"
            className="w-full"
            disabled={subscribeMutation.isPending}
          >
            {subscribeMutation.isPending ? (
              'Subscribing...'
            ) : (
              <>
                <Mail className="w-4 h-4 me-2" />
                Subscribe to Newsletter
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export const NewsletterFormWithSearchQuery = (props: NewsletterFormProps) => {
  const [fromSearchQuery] = useQueryState('from', {
    defaultValue: 'namefi-astra/newsletter-page',
  });
  const [attributesSearchQuery] = useQueryState<Record<string, unknown>>(
    'attributes',
    {
      parse: (value) => {
        try {
          return JSON.parse(value);
        } catch {
          return {};
        }
      },
      serialize: (value) => {
        return JSON.stringify(value);
      },
      defaultValue: {},
    },
  );
  return (
    <NewsletterForm
      {...props}
      from={fromSearchQuery}
      attributes={attributesSearchQuery}
    />
  );
};
