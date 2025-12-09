'use client';

import { useRef, useState, forwardRef } from 'react';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { useTRPC } from '@/lib/trpc';
import { cn } from '@/lib/cn';
import { toast } from 'sonner';
import { Mail, CheckCircle2, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import type {
  AltchaWidgetRef,
  AltchaVerifierRef,
  AltchaProps,
} from './altcha-verifier';

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
  email: z.string().email('Please enter a valid email address'),
  name: z.string().optional(),
});

type NewsletterFormData = z.infer<typeof newsletterFormSchema>;

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
  from,
  title = 'Stay Updated',
  description = 'Subscribe to our newsletter for the latest updates and announcements.',
  showNameField = true,
  variant = 'default',
  attributes,
  showCloseButton = false,
  onClose,
  className,
  headerClassName,
  contentClassName,
}: NewsletterFormProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const trpc = useTRPC();

  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      name: '',
    },
  });

  const subscribeMutation = useMutation(
    trpc.newsletter.subscribe.mutationOptions({
      onSuccess: (data) => {
        setIsSuccess(true);
        form.reset();
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

  const onSubmit = async (data: NewsletterFormData) => {
    subscribeMutation.mutate({
      email: data.email,
      name: data.name || undefined,
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
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col sm:flex-row gap-2 w-full max-w-md mx-auto"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    placeholder="Enter your email"
                    type="email"
                    {...field}
                    disabled={subscribeMutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={subscribeMutation.isPending || !form.formState.isValid}
            className="shrink-0"
          >
            {subscribeMutation.isPending ? (
              'Subscribing...'
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Subscribe
              </>
            )}
          </Button>
        </form>
      </Form>
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {showNameField && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your name"
                        {...field}
                        disabled={subscribeMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="your@email.com"
                      type="email"
                      {...field}
                      disabled={subscribeMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AltchaVerifier ref={altchaRef} expire={120_000} />

            <Button
              type="submit"
              className="w-full"
              disabled={subscribeMutation.isPending || !form.formState.isValid}
            >
              {subscribeMutation.isPending ? (
                'Subscribing...'
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Subscribe to Newsletter
                </>
              )}
            </Button>
          </form>
        </Form>
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
