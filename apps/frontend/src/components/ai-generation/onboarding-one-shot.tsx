/** biome-ignore-all lint/performance/noImgElement: using plain img in onboarding preview */
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Form } from '@/components/ui/shadcn/form';
import { NamefiButton } from '@/components/buttons/namefi-button';
import { Button } from '@/components/ui/shadcn/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';
import { DomainField } from './shared/form-fields';
import { baseFormSchema } from './shared/base-generator';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import type { BaseFormData } from './shared/base-generator';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { Generation } from './shared/types';
import {
  useLogoGeneration,
  usePosterGeneration,
} from './shared/generation-hooks';
import { motion } from 'motion/react';
import { Download, Copy } from 'lucide-react';
import { TwitterIcon } from 'react-share';
import { TwitterShareDialog } from '@/components/hunt/twitter-share-dialog';
import {
  defaultShareConfig,
  useTwitterShareDialog,
} from '@/hooks/use-twitter-share';
import { toast } from 'sonner';
import { GenerationUsage } from '@/components/ai-generation/generation-usage';

type OnboardingFormData = BaseFormData;

type StepState = 'idle' | 'generating_logo' | 'generating_marketing' | 'done';

export function AIOnboardingOneShot({
  onFinishAction,
}: {
  onFinishAction?: () => void;
}) {
  const router = useRouter();

  const [step, setStep] = useState<StepState>('idle');
  const [logoGen, setLogoGen] = useState<Generation | null>(null);
  const [marketingGen, setMarketingGen] = useState<Generation | null>(null);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(baseFormSchema),
    mode: 'onChange',
    defaultValues: {
      domain: '' as NamefiNormalizedDomain,
      description: '',
    } as unknown as OnboardingFormData,
  });

  const domain = form.watch('domain') as NamefiNormalizedDomain | undefined;
  const description = form.watch('description') as string | undefined;

  const lastSubmitted = useRef<{
    domain?: NamefiNormalizedDomain;
    description?: string;
  } | null>(null);

  const logoMutation = useLogoGeneration({ domain });
  const posterMutation = usePosterGeneration({ domain });

  const isLoading = logoMutation.isPending || posterMutation.isPending;
  const domainIsValid =
    !!domain && namefiNormalizedDomainSchema.safeParse(domain).success;
  const hasChangedSinceSubmit =
    !lastSubmitted.current ||
    lastSubmitted.current.domain !== domain ||
    (lastSubmitted.current.description || '') !== (description || '');
  const canSubmit =
    domainIsValid && !isLoading && (step !== 'done' || hasChangedSinceSubmit);
  const buttonText =
    step === 'generating_logo'
      ? 'Generating logo...'
      : step === 'generating_marketing'
        ? 'Generating marketing image...'
        : step === 'done'
          ? hasChangedSinceSubmit
            ? 'Create my brand'
            : 'Completed'
          : 'Create my brand';

  // If user edits inputs after completion, reset to idle so submit re-enables cleanly
  useEffect(() => {
    if (step === 'done' && hasChangedSinceSubmit) {
      setStep('idle');
    }
  }, [step, hasChangedSinceSubmit]);

  const onSubmit = async (values: OnboardingFormData & FieldValues) => {
    // Guard
    if (!values.domain) return;

    // 1) Generate Logo with defaults
    setStep('generating_logo');
    // Track last submitted inputs and reset previews
    lastSubmitted.current = {
      domain: values.domain as NamefiNormalizedDomain,
      description: values.description || '',
    };
    setLogoGen(null);
    setMarketingGen(null);
    const logoPayload = {
      domain: values.domain as NamefiNormalizedDomain,
      type: 'let-ai-choose',
      style: 'let-ai-choose',
      description: values.description || undefined,
      model: 'gpt-image-1' as const,
    };
    const logo = await logoMutation.mutateAsync(logoPayload).catch(() => null);
    if (!logo) {
      setStep('idle');
      return;
    }
    setLogoGen(logo);

    // 2) Generate Marketing image referencing the logo
    setStep('generating_marketing');
    const marketingPayload = {
      domain: values.domain as NamefiNormalizedDomain,
      description: values.description || undefined,
      referenceLogoGenerationId: logo.id,
      collateralType: 'let_ai_choose' as const,
      model: 'gemini-2.5-flash-image-preview' as const,
    };
    const marketing = await posterMutation
      .mutateAsync(marketingPayload)
      .catch(() => null);
    if (!marketing) {
      // We still show the logo result and allow navigating
      setStep('done');
      return;
    }
    setMarketingGen(marketing);
    setStep('done');
  };

  // Shared Twitter dialog (match regular flow)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shareDomain, setShareDomain] = useState<string | undefined>(undefined);
  const [shareUrl, setShareUrl] = useState<string>('');
  const shareDialog = useTwitterShareDialog({
    ...defaultShareConfig,
    enabled: true,
    trackShares: false,
    featureKey: 'ai_generation',
  });

  // Local progress indicator (percentage + rotating messages)
  const CircularProgress = ({ isLoading }: { isLoading: boolean }) => {
    const [progress, setProgress] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);
    const messages = [
      '🎨 Mixing digital paint...',
      '🤖 AI neurons firing...',
      '✨ Sprinkling creativity...',
      '🎭 Adding artistic flair...',
      '🌈 Blending colors perfectly...',
      '🔮 Channeling design magic...',
      '🎪 Orchestrating pixels...',
      '🚀 Launching imagination...',
      '💫 Polishing final touches...',
      '🎯 Perfecting composition...',
    ];

    // Drive progress + messages while loading
    useEffect(() => {
      if (!isLoading) return;
      let t: ReturnType<typeof setInterval> | null = null;
      let m: ReturnType<typeof setInterval> | null = null;
      setProgress(0);
      setMessageIndex(0);
      t = setInterval(() => {
        setProgress((prev) => {
          const timeConstant = 250;
          let elapsedIntervals =
            prev === 0 ? 0 : -timeConstant * Math.log(1 - prev / 95);
          elapsedIntervals += 1;
          const next = 95 * (1 - Math.exp(-elapsedIntervals / timeConstant));
          return Math.max(prev, next);
        });
      }, 100);
      m = setInterval(
        () => setMessageIndex((p) => (p + 1) % messages.length),
        2000,
      );
      return () => {
        if (t) clearInterval(t);
        if (m) clearInterval(m);
      };
    }, [isLoading]);

    const strokeWidth = 4;
    const radius = 40;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-24 h-24">
          <svg
            height={96}
            width={96}
            viewBox="0 0 96 96"
            className="absolute inset-0 transform -rotate-90"
            role="img"
            aria-labelledby="progressTitle"
          >
            <title id="progressTitle">{`Loading progress ${Math.round(progress)}%`}</title>
            <circle
              stroke="#e5e7eb"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={40}
              cx={48}
              cy={48}
            />
            <circle
              stroke="#10b981"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference + ' ' + circumference}
              style={{
                strokeDashoffset,
                transition: 'stroke-dashoffset 0.3s ease',
              }}
              r={40}
              cx={48}
              cy={48}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-semibold text-white select-none">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="text-sm text-gray-300 text-center"
        >
          {messages[messageIndex]}
        </motion.p>
      </div>
    );
  };

  const computeShareUrl = (gen?: Generation | null) => {
    if (!gen?.id || !gen?.domain) return '';
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/ai-brand-generator/${gen.id}`;
  };

  const handleDownload = async (gen?: Generation | null) => {
    if (!gen?.url) return;
    const response = await fetch(gen.url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${gen.domain}-generated.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  };

  const handleCopy = async (gen?: Generation | null) => {
    const url = computeShareUrl(gen);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Image URL copied to clipboard', {
        description: 'You can now share this image URL with others',
      });
    } catch {
      toast.error('Failed to copy image URL', {
        description: 'Please try again',
      });
    }
  };

  const handleTwitterShare = (gen?: Generation | null) => {
    const url = computeShareUrl(gen);
    if (!url || !gen?.domain) return;
    setShareDomain(gen.domain);
    setShareUrl(url);
    shareDialog.openDialog(gen.domain as any);
    setIsDialogOpen(true);
  };

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Start with one-click brand setup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            We will generate a logo and a marketing image with smart defaults.
            You can refine more afterwards.
          </p>

          <GenerationUsage className="mb-6" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {(() => {
                const inputLocked =
                  step === 'generating_logo' || step === 'generating_marketing';
                return (
                  <DomainField
                    control={form.control}
                    name={'domain'}
                    fixedDomain={
                      inputLocked
                        ? (domain as NamefiNormalizedDomain)
                        : undefined
                    }
                  />
                );
              })()}
              {/* Optional description kept hidden by default for simplicity; uncomment if needed */}
              {/* <DescriptionField control={form.control} name={'description'} /> */}

              <div className="flex gap-3">
                <NamefiButton
                  type="submit"
                  disabled={!canSubmit}
                  className="text-primary-foreground"
                >
                  {buttonText}
                </NamefiButton>
              </div>
            </form>
          </Form>

          {step !== 'idle' && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo column - visible once generation starts */}
              <div>
                <div className="text-sm font-medium mb-2">Logo</div>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                  {(step === 'generating_logo' && logoMutation.isPending) ||
                  (!logoGen?.url && step !== 'done') ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-700 z-10">
                      <CircularProgress isLoading={true} />
                    </div>
                  ) : null}
                  {logoGen?.url && (
                    <img
                      src={logoGen.url}
                      alt={logoGen.domain}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleDownload(logoGen)}
                    disabled={!logoGen?.url}
                  >
                    <Download className="w-4 h-4 mr-1" /> Download
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleCopy(logoGen)}
                    disabled={!logoGen?.id}
                  >
                    <Copy className="w-4 h-4 mr-1" /> Copy Link
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleTwitterShare(logoGen)}
                    disabled={!logoGen?.id}
                  >
                    <TwitterIcon className="w-4 h-4 mr-1 rounded" /> Twitter
                  </Button>
                </div>
              </div>
              {/* Marketing column - only after logo is done/started marketing */}
              {(step === 'generating_marketing' || marketingGen) && (
                <div>
                  <div className="text-sm font-medium mb-2">
                    Marketing image
                  </div>
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                    {(step === 'generating_marketing' &&
                      posterMutation.isPending) ||
                    (!marketingGen?.url && step !== 'done') ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-700 z-10">
                        <CircularProgress isLoading={true} />
                      </div>
                    ) : null}
                    {marketingGen?.url && (
                      <img
                        src={marketingGen.url}
                        alt={marketingGen.domain}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleDownload(marketingGen)}
                      disabled={!marketingGen?.url}
                    >
                      <Download className="w-4 h-4 mr-1" /> Download
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleCopy(marketingGen)}
                      disabled={!marketingGen?.id}
                    >
                      <Copy className="w-4 h-4 mr-1" /> Copy Link
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleTwitterShare(marketingGen)}
                      disabled={!marketingGen?.id}
                    >
                      <TwitterIcon className="w-4 h-4 mr-1 rounded" /> Twitter
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'done' && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <NamefiButton
                onClick={onFinishAction}
                className="flex-1 text-white"
              >
                Finish onboarding
              </NamefiButton>
            </div>
          )}

          {/* Shared Twitter dialog (same as regular flow) */}
          <TwitterShareDialog
            isOpen={isDialogOpen && !!shareDialog.isOpen}
            onClose={() => {
              setIsDialogOpen(false);
              shareDialog.onClose();
            }}
            domainName={shareDomain as any}
            shareUrl={shareUrl}
            hasShared={false}
            isCheckingStatus={false}
            isSubmitting={false}
            onSubmit={async () => {}}
            trackShares={false}
            campaignKey={undefined}
            featureKey="ai_generation"
          />
        </CardContent>
      </Card>
    </div>
  );
}
