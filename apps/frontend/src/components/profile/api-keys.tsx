'use client';

import { NamefiButton } from '@namefi-astra/ui/components/namefi/namefi-button';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import {
  Copy,
  Key,
  Loader2,
  Plus,
  Shield,
  ShieldOff,
  Trash2,
  Clock,
  Settings2,
} from 'lucide-react';
import { type HTMLAttributes, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useRegisterAdminFlags } from '@/components/admin/feature-flags/register';
import { useAdminFeatureFlag } from '@/components/admin/feature-flags/use-flag';
import {
  API_KEY_RESTRICTIONS_FLAG,
  CreateApiKeyDialog,
  PUBLIC_PRIVATE_KEY_FLAG,
} from './create-api-key-dialog';
import {
  EditApiKeyDialog,
  type EditableApiKeyRestrictions,
} from './edit-api-key-dialog';
import { RevokeApiKeyDialog } from './revoke-api-key-dialog';
import { formatDistanceToNow } from 'date-fns';

interface ApiKeysProps extends HTMLAttributes<HTMLDivElement> {}
const SHOW_COPY = false;
const API_KEY_ADMIN_FLAGS = [
  PUBLIC_PRIVATE_KEY_FLAG,
  API_KEY_RESTRICTIONS_FLAG,
];

export const ApiKeys = ({ className, ...rest }: ApiKeysProps) => {
  useRegisterAdminFlags(API_KEY_ADMIN_FLAGS);

  const t = useTranslations('profile');
  const trpc = useTRPC();
  const [enableApiKeyRestrictions] = useAdminFeatureFlag(
    API_KEY_RESTRICTIONS_FLAG,
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [keyToEdit, setKeyToEdit] = useState<EditableApiKeyRestrictions | null>(
    null,
  );

  const {
    data: apiKeys,
    isLoading,
    refetch,
  } = useQuery(trpc.apiKeys.list.queryOptions());

  const handleCopyKeyPrefix = useCallback(
    async (keyPrefix: string) => {
      await navigator.clipboard.writeText(keyPrefix);
      toast(t('apiKeys.keyPrefixCopied'), {
        description: t('apiKeys.keyPrefixCopiedDescription'),
      });
    },
    [t],
  );

  const handleRevokeClick = useCallback((keyId: string, keyName: string) => {
    setKeyToRevoke({ id: keyId, name: keyName });
    setIsRevokeDialogOpen(true);
  }, []);

  const handleEditClick = useCallback(
    (
      key: Pick<EditableApiKeyRestrictions, 'id' | 'name' | 'type'> &
        Partial<
          Pick<
            EditableApiKeyRestrictions,
            | 'allowedIps'
            | 'allowedOrigins'
            | 'allowBrowserRequests'
            | 'allowServerRequests'
          >
        >,
    ) => {
      setKeyToEdit({
        id: key.id,
        name: key.name,
        type: key.type,
        allowedIps: key.allowedIps ?? null,
        allowedOrigins: key.allowedOrigins ?? null,
        allowBrowserRequests: key.allowBrowserRequests ?? false,
        allowServerRequests: key.allowServerRequests ?? false,
      });
      setIsEditDialogOpen(true);
    },
    [],
  );

  const handleCreateSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRevokeSuccess = useCallback(() => {
    refetch();
    setIsRevokeDialogOpen(false);
    setKeyToRevoke(null);
  }, [refetch]);

  const handleEditSuccess = useCallback(() => {
    refetch();
    setIsEditDialogOpen(false);
    setKeyToEdit(null);
  }, [refetch]);

  const getKeyTypeIcon = (type: string) => {
    switch (type) {
      case 'PLAIN':
        return <Key className="h-4 w-4" />;
      case 'PUBLIC_PRIVATE':
        return <Shield className="h-4 w-4" />;
      default:
        return <Key className="h-4 w-4" />;
    }
  };

  const getKeyTypeBadge = (type: string) => {
    switch (type) {
      case 'PLAIN':
        return <Badge variant="secondary">{t('apiKeys.badgePlain')}</Badge>;
      case 'PUBLIC_PRIVATE':
        return (
          <Badge variant="outline">{t('apiKeys.badgePublicPrivate')}</Badge>
        );
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getStatusBadge = (key: {
    isActive: boolean;
    isExpired: boolean | null;
    revokedAt: Date | null;
  }) => {
    if (key.revokedAt) {
      return (
        <Badge variant="destructive" className="gap-1">
          <ShieldOff className="h-3 w-3" />
          {t('apiKeys.statusRevoked')}
        </Badge>
      );
    }
    if (key.isExpired) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          {t('apiKeys.statusExpired')}
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1 bg-green-300/80">
        <Shield className="h-3 w-3" />
        {t('apiKeys.statusActive')}
      </Badge>
    );
  };

  return (
    <Card className={cn('', className)} {...rest}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle>{t('apiKeys.title')}</CardTitle>
          </div>
          <CardDescription>{t('apiKeys.description')}</CardDescription>
        </div>

        <NamefiButton
          size="default"
          className="gap-1 py-1"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          {t('apiKeys.create')}
        </NamefiButton>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !apiKeys || apiKeys.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">{t('apiKeys.empty')}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              {t('apiKeys.createApiKey')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-4',
                  !key.isActive && 'opacity-60',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {getKeyTypeIcon(key.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{key.name}</span>
                      {getKeyTypeBadge(key.type)}
                      {getStatusBadge(key)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                        {key.keyPrefix}...
                      </code>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>
                        {t('apiKeys.createdAgo', {
                          time: formatDistanceToNow(new Date(key.createdAt), {
                            addSuffix: true,
                          }),
                        })}
                      </span>
                      {key.lastUsedAt && (
                        <span>
                          {t('apiKeys.lastUsedAgo', {
                            time: formatDistanceToNow(
                              new Date(key.lastUsedAt),
                              {
                                addSuffix: true,
                              },
                            ),
                          })}
                        </span>
                      )}
                      {key.expiresAt && (
                        <span>
                          {new Date(key.expiresAt) > new Date()
                            ? t('apiKeys.expiresAgo', {
                                time: formatDistanceToNow(
                                  new Date(key.expiresAt),
                                  { addSuffix: true },
                                ),
                              })
                            : t('apiKeys.expiredAgo', {
                                time: formatDistanceToNow(
                                  new Date(key.expiresAt),
                                  { addSuffix: true },
                                ),
                              })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {SHOW_COPY && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleCopyKeyPrefix(key.keyPrefix)}
                              aria-label={t('apiKeys.copyKeyPrefixAriaLabel')}
                            />
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('apiKeys.copyKeyPrefixTooltip')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {enableApiKeyRestrictions &&
                    key.isActive &&
                    key.type === 'PLAIN' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditClick(key)}
                                aria-label={t(
                                  'apiKeys.editRestrictionsAriaLabel',
                                )}
                              />
                            }
                          >
                            <Settings2 className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            {t('apiKeys.editRestrictionsTooltip')}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                  {key.isActive && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleRevokeClick(key.id, key.name)
                              }
                              aria-label={t('apiKeys.revokeKeyAriaLabel')}
                            />
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('apiKeys.revokeKeyTooltip')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CreateApiKeyDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <RevokeApiKeyDialog
        isOpen={isRevokeDialogOpen}
        onOpenChange={setIsRevokeDialogOpen}
        keyToRevoke={keyToRevoke}
        onSuccess={handleRevokeSuccess}
      />

      {enableApiKeyRestrictions && (
        <EditApiKeyDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          apiKey={keyToEdit}
          onSuccess={handleEditSuccess}
        />
      )}
    </Card>
  );
};
