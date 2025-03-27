'use client';

import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Textarea } from '@/components/ui/shadcn/textarea';
import type { User } from '@privy-io/react-auth';
import { Pencil, Save, User2 } from 'lucide-react';
import { type HTMLAttributes, useCallback } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

export interface PersonalProps extends HTMLAttributes<HTMLDivElement> {
  user: User;
}

export const Personal = ({ user }: PersonalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('Tell us about yourself');

  const handleSave = useCallback(() => {
    setIsEditing(false);
    toast('Profile updated', {
      description: 'Your profile information has been saved successfully.',
    });
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <User2 className="h-5 w-5 text-primary" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>Update your personal information</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <Save className="mr-2 h-4 w-4" />
          ) : (
            <Pencil className="mr-2 h-4 w-4" />
          )}
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user.email?.address || ''}
            disabled={true}
          />
          {user.email?.address ? (
            <p className="text-xs text-green-600 dark:text-green-400">
              Verified
            </p>
          ) : user.email?.address ? (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Not verified
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={!isEditing}
            className="min-h-[100px]"
            placeholder="Tell us about yourself"
          />
        </div>
      </CardContent>
      {isEditing && (
        <CardFooter>
          <Button onClick={handleSave} className="ml-auto gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
