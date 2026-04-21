import { cn } from '@namefi-astra/ui/lib/cn';

export const UpvoteIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn('w-[1em] h-[1em]', className)}
    >
      <title>Upvote</title>
      <path
        d="M11.2439 7.12287C11.6427 6.66241 12.357 6.66241 12.7558 7.12287L18.3611 13.5953C18.922 14.243 18.4619 15.25 17.6052 15.25H6.39452C5.53776 15.25 5.07771 14.243 5.63859 13.5953L11.2439 7.12287Z"
        fill="currentColor"
      />
    </svg>
  );
};
