'use client';

import { Button } from '@/components/ui/shadcn/button';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface CopyLinkButtonProps {
  link: string;
}

export function CopyLinkButton({ link }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void handleCopy();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
      }}
      className="bg-muted/90"
      title={copied ? 'Copied!' : 'Copy link'}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}
