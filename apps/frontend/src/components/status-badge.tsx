'use client';

import { Badge } from '@namefi-astra/ui/components/shadcn/badge';

type StatusBadgeType = 'order' | 'payment';

interface StatusBadgeProps {
  status: string;
  type: StatusBadgeType;
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const getStatusBadge = (status: string, _type: StatusBadgeType) => {
    switch (status) {
      case 'CREATED':
        return (
          <Badge
            variant="secondary"
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Created
          </Badge>
        );
      case 'PROCESSING':
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 hover:bg-blue-200"
          >
            Processing
          </Badge>
        );
      case 'SUCCEEDED':
      case 'COMPLETED':
        return (
          <Badge className="bg-green-600 text-secondary-foreground hover:bg-green-700">
            {status === 'SUCCEEDED' ? 'Succeeded' : 'Completed'}
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge
            variant="secondary"
            className="bg-red-900 text-secondary-foreground hover:bg-red-950"
          >
            Failed
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge
            variant="outline"
            className="border-orange-500 bg-orange-400 text-secondary-foreground hover:bg-orange-500"
          >
            Cancelled
          </Badge>
        );
      case 'PARTIALLY_COMPLETED':
        return (
          <Badge
            variant="outline"
            className="border-amber-400 bg-amber-200 text-gray-800 hover:text-secondary-foreground hover:bg-amber-400"
          >
            Partially Completed
          </Badge>
        );
      case 'REQUIRES_ACTION':
        return (
          <Badge
            variant="outline"
            className="border-amber-500 bg-amber-300 text-gray-800 hover:text-secondary-foreground hover:bg-amber-500"
          >
            Waiting For User
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge
            variant="outline"
            className="border-amber-500 bg-amber-300 text-gray-800 hover:text-secondary-foreground hover:bg-amber-500"
          >
            Pending
          </Badge>
        );
      case 'REFUND_REQUESTED': //TODO: change to refunded
        return (
          <Badge
            variant="outline"
            className="border-purple-500 bg-purple-300 text-gray-800 hover:text-secondary-foreground hover:bg-purple-500"
          >
            Refunded
          </Badge>
        );
      case 'REQUIRES_CAPTURE':
        return (
          <Badge
            variant="outline"
            className="border-orange-500 bg-orange-300 text-gray-800 hover:text-secondary-foreground hover:bg-orange-500"
          >
            Requires Capture
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100"
          >
            {status || 'Unknown'}
          </Badge>
        );
    }
  };

  return getStatusBadge(status, type);
}
