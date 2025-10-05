import React from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './ui/shadcn/hover-card';
import { useId } from 'react';

function centerTruncateString(str: string, length: number, filler = '...') {
  if (str.length > length) {
    const charsLength = length - filler.length;
    const firstPartLength = Math.floor(charsLength / 2);
    const secondPartLength = charsLength - firstPartLength;

    return (
      str.substring(0, firstPartLength + 1) +
      filler +
      str.substring(str.length - secondPartLength)
    );
  }
  return str;
}

export function TruncatedTextWithHover({
  children,
  maxLength,
  fillerString,
}: {
  children: string;
  maxLength?: number;
  fillerString?: string;
}) {
  const id = useId();
  const [open, setOpen] = React.useState<boolean>(false);
  if (!maxLength || children.length < maxLength) {
    return (
      <span id={id} key={id}>
        {children}
      </span>
    );
  }

  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger
        onClick={(e) => {
          e.stopPropagation();
          if (!open) {
            setTimeout(() => {
              setOpen(false);
            }, 3000);
          }
          setOpen((open) => !open);
        }}
      >
        <span id={id} key={id}>
          {centerTruncateString(children, maxLength, fillerString)}
        </span>
      </HoverCardTrigger>
      <HoverCardContent align={'center'} className="w-full text-sm">
        <div>{children}</div>
      </HoverCardContent>
    </HoverCard>
  );
}
