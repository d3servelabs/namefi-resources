import { CartCard } from '@/components/cart-card';

interface AuthRequiredProps {
  title?: string;
  description?: string;
}

export function AuthRequired({
  title = 'Sign in required',
  description = 'Please sign in to continue',
}: AuthRequiredProps) {
  return (
    <div className="container mx-auto py-8 px-8">
      <CartCard title={title} description={description} />
    </div>
  );
}
