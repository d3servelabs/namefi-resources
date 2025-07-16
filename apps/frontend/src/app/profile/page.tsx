import type { Metadata } from 'next';
import Profile from '@/components/profile/profile';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your profile and account settings',
};

export default function ProfilePage() {
  return <Profile />;
}
