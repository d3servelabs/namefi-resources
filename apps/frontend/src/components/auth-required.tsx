import { LogIn } from 'lucide-react';
import { UserDropdown } from './dropdowns/user-dropdown';
import { PageShell } from '@/components/page-shell';

interface AuthRequiredProps {
  title?: string;
  description?: string;
}

export function AuthRequired({
  title = 'Sign in required',
  description = 'Please sign in to continue',
}: AuthRequiredProps) {
  return (
    <PageShell
      padding="none"
      shellClassName="py-12 px-8"
      className="flex items-center justify-center"
    >
      <div className="bg-white/[0.03] border border-white/10 shadow-sm rounded-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-muted rounded-full p-4 mb-6">
            <LogIn className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">{title}</h2>
          <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
          <UserDropdown className="w-fit" />
        </div>
      </div>
    </PageShell>
  );
}
