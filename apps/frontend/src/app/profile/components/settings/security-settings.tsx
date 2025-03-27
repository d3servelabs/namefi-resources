'use client';

import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcn/dialog';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Switch } from '@/components/ui/shadcn/switch';
import type { User } from '@privy-io/react-auth';
import { AlertTriangle, Key, Shield } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SecuritySettingsProps {
  user: User;
}

export default function SecuritySettings({ user }: SecuritySettingsProps) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [recoveryEnabled, setRecoveryEnabled] = useState(true);
  const [activityAlerts, setActivityAlerts] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleToggleTwoFactor = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    toast(twoFactorEnabled ? '2FA Disabled' : '2FA Enabled', {
      description: twoFactorEnabled
        ? 'Two-factor authentication has been disabled for your account.'
        : 'Two-factor authentication has been enabled for your account.',
    });
  };

  const handleToggleRecovery = () => {
    setRecoveryEnabled(!recoveryEnabled);
    toast(recoveryEnabled ? 'Recovery Disabled' : 'Recovery Enabled', {
      description: recoveryEnabled
        ? 'Account recovery has been disabled for your account.'
        : 'Account recovery has been enabled for your account.',
    });
  };

  const handleToggleActivityAlerts = () => {
    setActivityAlerts(!activityAlerts);
    toast(activityAlerts ? 'Alerts Disabled' : 'Alerts Enabled', {
      description: activityAlerts
        ? 'You will no longer receive alerts for suspicious activity.'
        : 'You will now receive alerts for suspicious activity.',
    });
  };

  const handleChangePassword = () => {
    if (!(currentPassword && newPassword && confirmPassword)) {
      toast('Missing fields', {
        description: 'Please fill in all password fields.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast("Passwords don't match", {
        description: 'New password and confirmation do not match.',
      });
      return;
    }

    // In a real implementation, you would call the appropriate Privy method
    toast('Password updated', {
      description: 'Your password has been changed successfully.',
    });
    setIsPasswordDialogOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Security Settings</CardTitle>
        </div>
        <CardDescription>
          Manage your account security preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="two-factor">Two-factor authentication</Label>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account
            </p>
          </div>
          <Switch
            id="two-factor"
            checked={twoFactorEnabled}
            onCheckedChange={handleToggleTwoFactor}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="recovery">Account recovery</Label>
            <p className="text-sm text-muted-foreground">
              Enable account recovery options
            </p>
          </div>
          <Switch
            id="recovery"
            checked={recoveryEnabled}
            onCheckedChange={handleToggleRecovery}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="activity-alerts">Activity alerts</Label>
            <p className="text-sm text-muted-foreground">
              Get notified about suspicious activity
            </p>
          </div>
          <Switch
            id="activity-alerts"
            checked={activityAlerts}
            onCheckedChange={handleToggleActivityAlerts}
          />
        </div>

        <div className="pt-4">
          <Dialog
            open={isPasswordDialogOpen}
            onOpenChange={setIsPasswordDialogOpen}
          >
            <DialogTrigger asChild={true}>
              <Button variant="outline" className="gap-2">
                <Key className="h-4 w-4" />
                Change Password
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  Enter your current password and a new password.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsPasswordDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleChangePassword}>Update Password</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle
                className="h-5 w-5 text-yellow-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Security Recommendation
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  We recommend enabling two-factor authentication for additional
                  account security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
