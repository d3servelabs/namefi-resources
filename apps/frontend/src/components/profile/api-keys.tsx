'use client';

import { NamefiButton } from '@/components/buttons/namefi-button';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { Badge } from '@/components/ui/shadcn/badge';
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
} from 'lucide-react';
import { type HTMLAttributes, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { CreateApiKeyDialog } from './create-api-key-dialog';
import { RevokeApiKeyDialog } from './revoke-api-key-dialog';
import { formatDistanceToNow } from 'date-fns';

interface ApiKeysProps extends HTMLAttributes<HTMLDivElement> {}
const SHOW_COPY = false;
export const ApiKeys = ({ className, ...rest }: ApiKeysProps) => {
  const trpc = useTRPC();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const {
    data: apiKeys,
    isLoading,
    refetch,
  } = useQuery(trpc.apiKeys.list.queryOptions());

  const handleCopyKeyPrefix = useCallback(async (keyPrefix: string) => {
    await navigator.clipboard.writeText(keyPrefix);
    toast('Key prefix copied', {
      description: 'API key prefix copied to clipboard',
    });
  }, []);

  const handleRevokeClick = useCallback((keyId: string, keyName: string) => {
    setKeyToRevoke({ id: keyId, name: keyName });
    setIsRevokeDialogOpen(true);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRevokeSuccess = useCallback(() => {
    refetch();
    setIsRevokeDialogOpen(false);
    setKeyToRevoke(null);
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
        return <Badge variant="secondary">Plain</Badge>;
      case 'PUBLIC_PRIVATE':
        return <Badge variant="outline">Public/Private</Badge>;
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
          Revoked
        </Badge>
      );
    }
    if (key.isExpired) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Expired
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1 bg-green-300/80">
        <Shield className="h-3 w-3" />
        Active
      </Badge>
    );
  };

  return (
    <Card className={cn('', className)} {...rest}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle>API Keys</CardTitle>
          </div>
          <CardDescription>
            Manage your API keys for programmatic access
          </CardDescription>
        </div>

        <NamefiButton
          size="default"
          className="gap-1 py-1"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Create
        </NamefiButton>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !apiKeys || apiKeys.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">No API keys</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Create API Key
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
                        Created{' '}
                        {formatDistanceToNow(new Date(key.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {key.lastUsedAt && (
                        <span>
                          Last used{' '}
                          {formatDistanceToNow(new Date(key.lastUsedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                      {key.expiresAt && (
                        <span>
                          {new Date(key.expiresAt) > new Date()
                            ? `Expires ${formatDistanceToNow(new Date(key.expiresAt), { addSuffix: true })}`
                            : `Expired ${formatDistanceToNow(new Date(key.expiresAt), { addSuffix: true })}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {SHOW_COPY && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopyKeyPrefix(key.keyPrefix)}
                            aria-label="Copy key prefix"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy key prefix</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {key.isActive && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleRevokeClick(key.id, key.name)}
                            aria-label="Revoke API key"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Revoke API key</TooltipContent>
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
    </Card>
  );
};
