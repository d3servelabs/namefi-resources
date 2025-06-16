'use client';

import { AsyncButton } from '@/components/buttons/AsyncButton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { cn } from '@/lib/utils';
import { useTRPC } from '@/utils/trpc';
import type { Nameserver } from '@namefi-astra/registrars/lib/abstract-registrar/data/nameservers';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import {
  Info,
  Loader2,
  ShieldCheckIcon,
  ShieldMinusIcon,
  ShieldPlusIcon,
  ShieldXIcon,
} from 'lucide-react';
import { isNotEmpty, isNotNil } from 'ramda';
import { useMemo } from 'react';
import { toast } from 'sonner';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          DNSSEC Management
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild={true}>
                <Info className="h-4 w-4 text-zinc-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  DNSSEC is a security feature that helps to protect your domain
                  from phishing attacks.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export type DomainNameserversFormProps = {
  domainName: PunycodeDomainName;
  nameservers: Nameserver[];
};
export type DomainNameserversFormData = {
  nameservers: Nameserver[];
};

export const DnssecPanel = ({
  domainName,
}: { domainName: PunycodeDomainName }) => {
  const trpc = useTRPC();
  const {
    data: { features: domainSupportedFeatures },
  } = useSuspenseQuery(
    trpc.domainConfig.getDomainSupportedFeatures.queryOptions(
      {
        normalizedDomainName: domainName,
      },
      {
        refetchInterval: 10000,
      },
    ),
  );
  const dnssecManagement = useMemo(() => {
    return (
      domainSupportedFeatures.dnssecManagement ?? {
        enabled: false,
        config: {
          showPanel: false,
          message: 'Coming Soon ...',
        },
      }
    );
  }, [domainSupportedFeatures]);
  if (!dnssecManagement.config.showPanel) {
    return false;
  }
  if (dnssecManagement.enabled) {
    return <DnssecPanelInner domainName={domainName} />;
  }
  if (dnssecManagement.config.message) {
    return (
      <Card className={cn('bg-zinc-900 border-zinc-800')}>
        <CardHeader>
          <CardTitle>DNSSEC Management</CardTitle>
        </CardHeader>
        <div
          className="text-center py-12"
          // biome-ignore lint/security/noDangerouslySetInnerHtml:
          dangerouslySetInnerHTML={{
            __html: dnssecManagement.config.message,
          }}
        />
      </Card>
    );
  }
  return false;
};

export const DnssecPanelInner = ({
  domainName,
}: { domainName: PunycodeDomainName }) => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(
    trpc.domainConfig.dnssec.getDomainDnssecDetails.queryOptions({
      domainName,
    }),
  );

  const enableNamefiSigning = useMutation(
    trpc.domainConfig.dnssec.enableDnssec.mutationOptions({
      onSuccess() {
        toast.success('Request to Enable DNSSEC has been sent');
      },
      onError(error) {
        console.error(error);
        toast.error('Request to Enable DNSSEC has failed');
      },
    }),
  );
  const disableNamefiSigning = useMutation(
    trpc.domainConfig.dnssec.disableDnssec.mutationOptions({
      onSuccess() {
        toast.success('Request to Disable DNSSEC has been sent');
      },
      onError(error) {
        console.error(error);
        toast.error('Request to Disable DNSSEC has failed');
      },
    }),
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div>No DNSSEC details found</div>
      </Layout>
    );
  }

  if (!data.supportsDnssec) {
    return (
      <Layout>
        <div>DNSSEC is not supported for this domain</div>
      </Layout>
    );
  }

  const zoneSigningStatus = (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        {data.zoneHasActiveDnssec ? (
          <>
            <ShieldCheckIcon className="w-6 h-6 text-green-500" />
            <p>Zone is signing records</p>
          </>
        ) : (
          <>
            <ShieldXIcon className="w-6 h-6 text-red-500" />
            <p>Zone is not signing records</p>
          </>
        )}
      </div>
    </div>
  );

  const isUsingNamefiSigning =
    data.isUsingNamefiDelegationSigner && data.zoneHasActiveDnssec;

  return (
    <Layout>
      <div className="flex flex-col items-start gap-4">
        {isUsingNamefiSigning ? (
          <div className="flex items-center gap-2">
            <p>Namefi is signing records for this domain</p>
          </div>
        ) : undefined}

        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            {isNotNil(data.delegationSigners) &&
            isNotEmpty(data.delegationSigners) ? (
              <>
                {data.isUsingNamefiDelegationSigner &&
                data.delegationSigners.length === 1 ? (
                  <>
                    <ShieldCheckIcon className="w-6 h-6 text-green-500" />
                    <p>Namefi is the only delegation signer for this domain</p>
                  </>
                ) : (
                  <>
                    <p>Custom delegation signers:</p>
                    <p>
                      {data.delegationSigners
                        ?.map((signer) => signer.keyTag)
                        .join(', ')}
                    </p>
                  </>
                )}
              </>
            ) : (
              <>
                <ShieldXIcon className="w-6 h-6 text-red-500" />
                <p>No delegation signers</p>
              </>
            )}
          </div>

          {zoneSigningStatus}
        </div>

        <div className="flex items-center gap-2 justify-between">
          {isUsingNamefiSigning ? (
            <AsyncButton
              loadingText="Disabling..."
              onClick={(e) => disableNamefiSigning.mutateAsync({ domainName })}
              variant={'default'}
            >
              <ShieldMinusIcon width={20} height={20} /> Disable Namefi Signing
            </AsyncButton>
          ) : (
            <AsyncButton
              loadingText="Enabling..."
              onClick={(e) => enableNamefiSigning.mutateAsync({ domainName })}
              variant={'default'}
            >
              <ShieldPlusIcon width={20} height={20} /> Enable Namefi Signing
            </AsyncButton>
          )}
        </div>

        <div className="text-sm text-zinc-500 mt-4">
          <p>
            Changes to nameservers can take 24-48 hours to propagate globally.
          </p>
        </div>
      </div>
    </Layout>
  );
};
