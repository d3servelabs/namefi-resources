'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { Separator } from '@/components/ui/shadcn/separator';
import {
  Mail,
  Globe,
  MessageSquare,
  Info,
  Clock,
  User,
  Copy,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { PbnIssuanceReservationSelect } from '@namefi-astra/db';

interface GiftDetailsDialogProps {
  gift: PbnIssuanceReservationSelect;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GiftDetailsDialog({
  gift,
  open,
  onOpenChange,
}: GiftDetailsDialogProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      CREATED: {
        variant: 'default' as const,
        color: 'text-blue-600',
        label: 'Sent',
      },
      CLAIMED: {
        variant: 'secondary' as const,
        color: 'text-green-600',
        label: 'Received',
      },
      EXPIRED: {
        variant: 'destructive' as const,
        color: 'text-red-600',
        label: 'Expired',
      },
      CANCELLED: {
        variant: 'outline' as const,
        color: 'text-gray-600',
        label: 'Cancelled',
      },
    };

    const config =
      variants[status as keyof typeof variants] || variants.CREATED;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusDescription = (status: string) => {
    const descriptions = {
      CREATED: 'Gift has been sent and is awaiting pickup',
      CLAIMED: "Recipient has received the gift and it's now a free claim",
      EXPIRED: 'Gift has expired and can no longer be claimed',
      CANCELLED: 'Gift was cancelled by the sender',
    };
    return (
      descriptions[status as keyof typeof descriptions] || 'Unknown status'
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const now = new Date();
  const reservationExpiresAt = gift.reserveHold
    ? gift.reservationExpirationDate
      ? new Date(gift.reservationExpirationDate)
      : null
    : null;
  const freeClaimExpiresAt = gift.issueFreeClaim
    ? gift.freeClaimExpirationDate
      ? new Date(gift.freeClaimExpirationDate)
      : null
    : null;

  const isReservationExpired =
    !!reservationExpiresAt && now > reservationExpiresAt;
  const isFreeClaimExpired = !!freeClaimExpiresAt && now > freeClaimExpiresAt;

  const daysLeft = (d: Date | null) =>
    d ? Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const reservationDaysLeft = daysLeft(reservationExpiresAt);
  const freeClaimDaysLeft = daysLeft(freeClaimExpiresAt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Gift Details</span>
            {getStatusBadge(gift.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Status</p>
                <p className="text-sm text-muted-foreground">
                  {getStatusDescription(gift.status)}
                </p>
              </div>
            </div>
          </div>

          {/* Domain Information */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>Domain Details</span>
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">PBN Domain</p>
                <div className="flex items-center space-x-2">
                  <p className="font-mono">{gift.pbnDomain}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(gift.pbnDomain, 'Domain')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Gift Type</p>
                <p>
                  {gift.exactDomainName ? (
                    <span>
                      Exact Domain:{' '}
                      <code className="bg-muted px-1 rounded">
                        {gift.exactDomainName}
                      </code>
                    </span>
                  ) : (
                    <span>
                      Any Subdomain:{' '}
                      <code className="bg-muted px-1 rounded">
                        *.{gift.parentDomain}
                      </code>
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Recipient Information */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Recipient</span>
            </h3>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono">{gift.recipientEmail}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  copyToClipboard(gift.recipientEmail ?? '', 'Email')
                }
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            {gift.recipientUserId && (
              <p className="text-sm text-green-600">
                ✓ Recipient has a Namefi account
              </p>
            )}
          </div>

          <Separator />

          {/* Timing Information */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Timing</span>
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p>{format(new Date(gift.createdAt), 'PPP p')}</p>
              </div>
              {gift.reserveHold && (
                <div>
                  <p className="text-muted-foreground">Hold expires</p>
                  <div className="flex items-center space-x-2">
                    <p>
                      {reservationExpiresAt
                        ? format(reservationExpiresAt, 'PPP')
                        : 'No expiration'}
                    </p>
                    {reservationExpiresAt &&
                      !isReservationExpired &&
                      gift.status === 'CREATED' && (
                        <Badge variant="outline" className="text-xs">
                          {reservationDaysLeft && reservationDaysLeft > 0
                            ? `${reservationDaysLeft} days left`
                            : 'Expires today'}
                        </Badge>
                      )}
                  </div>
                </div>
              )}
              {gift.issueFreeClaim && (
                <div>
                  <p className="text-muted-foreground">Free-claim expires</p>
                  <div className="flex items-center space-x-2">
                    <p>
                      {freeClaimExpiresAt
                        ? format(freeClaimExpiresAt, 'PPP')
                        : 'No expiration'}
                    </p>
                    {freeClaimExpiresAt &&
                      !isFreeClaimExpired &&
                      gift.status === 'CREATED' && (
                        <Badge variant="outline" className="text-xs">
                          {freeClaimDaysLeft && freeClaimDaysLeft > 0
                            ? `${freeClaimDaysLeft} days left`
                            : 'Expires today'}
                        </Badge>
                      )}
                  </div>
                </div>
              )}
            </div>
            {gift.claimedAt && (
              <div>
                <p className="text-muted-foreground">Received</p>
                <p className="text-green-600">
                  {format(new Date(gift.claimedAt), 'PPP p')}
                </p>
              </div>
            )}
          </div>

          {/* Messages */}
          {(gift.reason || gift.personalMessage) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Messages</span>
                </h3>
                {gift.reason && (
                  <div>
                    <p className="text-muted-foreground text-sm">Reason</p>
                    <p className="text-sm">{gift.reason}</p>
                  </div>
                )}
                {gift.personalMessage && (
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Personal Message
                    </p>
                    <div className="bg-muted/50 p-3 rounded-lg text-sm">
                      {gift.personalMessage}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Metadata */}
          {gift.metadata && Object.keys(gift.metadata).length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium">Additional Information</h3>
                <div className="text-xs text-muted-foreground">
                  <pre className="bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(gift.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {gift.status === 'CREATED' && (
              <Button
                variant="outline"
                onClick={() => {
                  // TODO: Implement resend email functionality
                  toast.info('Resend email functionality coming soon');
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Resend Email
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
