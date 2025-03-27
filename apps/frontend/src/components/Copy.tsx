'use client';

import { cn } from '@/lib/utils';
import { CopyIcon } from 'lucide-react';
import {
  type FC,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
} from 'react';
import { toast } from 'sonner';

export type CopyProps = HTMLAttributes<HTMLDivElement> & {
  text: string;
  copiedTitle?: (() => ReactNode) | ReactNode;
  copiedDescription?: (() => ReactNode) | ReactNode;
};

export const Copy: FC<CopyProps> = ({
  text,
  copiedTitle = 'Copied',
  copiedDescription = 'Copied',
  className,
  children,
  ...rest
}: CopyProps) => {
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);

    if (copiedTitle || copiedDescription) {
      toast(copiedTitle, {
        description: copiedDescription,
      });
    }
  }, [text, copiedTitle, copiedDescription]);

  return (
    <div className={cn('flex items-center gap-1', className)} {...rest}>
      <span title={text} className="">
        {children}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-full p-1 hover:bg-muted"
        aria-label="Copy"
      >
        <CopyIcon className="h-3 w-3" />
      </button>
    </div>
  );
};

Copy.displayName = 'Copy';
