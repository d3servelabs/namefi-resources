import { Loader2, Sparkles } from 'lucide-react';
import { NamefiButton } from '@namefi-astra/ui/components/namefi/namefi-button';
import { cn } from '@namefi-astra/ui/lib/cn';

interface GenerateSubmitButtonProps {
  isLoading?: boolean;
  disabled?: boolean;
  loadingText?: string;
  buttonText?: string;
  className?: string;
  type?: 'button' | 'submit';
}

export function GenerateSubmitButton({
  isLoading = false,
  disabled = false,
  loadingText = 'Generating',
  buttonText = 'Generate',
  className,
  type = 'submit',
}: GenerateSubmitButtonProps) {
  return (
    <NamefiButton
      type={type}
      disabled={isLoading || disabled}
      className={cn('self-center mt-8 w-90 text-primary-foreground', className)}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          {buttonText}
        </>
      )}
    </NamefiButton>
  );
}
