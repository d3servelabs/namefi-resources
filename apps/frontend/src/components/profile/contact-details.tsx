'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { CountryDropdown, type Country } from '@/components/country-input';
import { ContactAccounts } from './contact-accounts';
import { EmailSubscriptionSettings } from './email-subscription-settings';
import { useTRPC } from '@/lib/trpc';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Globe, Loader2, Save, MessageCircle, User } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { privyCustomMetadataSchema } from '@namefi-astra/common/privy-custom-metadata';
import { useAuth } from '@/hooks/use-auth';
import { useQueryState, parseAsString } from 'nuqs';

// Helper function to add trimming and empty string handling to a string schema
const withFormValidation = (schema: z.ZodOptional<z.ZodString>) =>
  schema.or(z.literal('')).transform((val) => val?.trim() || undefined);

// Extend the backend schema for frontend form validation
const contactDetailsFormSchema = privyCustomMetadataSchema
  .pick({
    fullName: true,
    address: true,
  })
  .extend({
    fullName: withFormValidation(privyCustomMetadataSchema.shape.fullName),
    address: privyCustomMetadataSchema.shape.address
      .unwrap()
      .extend({
        street: withFormValidation(
          privyCustomMetadataSchema.shape.address.unwrap().shape.street,
        ),
        city: withFormValidation(
          privyCustomMetadataSchema.shape.address.unwrap().shape.city,
        ),
        state: withFormValidation(
          privyCustomMetadataSchema.shape.address.unwrap().shape.state,
        ),
        zipCode: withFormValidation(
          privyCustomMetadataSchema.shape.address.unwrap().shape.zipCode,
        ),
        country: withFormValidation(
          privyCustomMetadataSchema.shape.address.unwrap().shape.country,
        ),
      })
      .optional(),
  });

type ContactDetailsFormData = z.infer<typeof contactDetailsFormSchema>;

export function ContactDetails() {
  const trpc = useTRPC();
  const { privyUser } = useAuth();
  const [focus, setFocus] = useQueryState('focus', parseAsString);

  // Mutation for updating custom metadata
  const { mutate: updateMetadata, isPending: isUpdatingMetadata } = useMutation(
    trpc.users.updatePrivyCustomMetadata.mutationOptions({
      onSuccess: () => {
        toast.success('Contact details updated successfully');
      },
      onError: (error: any) => {
        toast.error('Failed to update contact details', {
          description: error.message,
        });
      },
    }),
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm<ContactDetailsFormData>({
    resolver: zodResolver(contactDetailsFormSchema),
    defaultValues: {
      fullName: '',
      address: undefined,
    },
  });

  // Load contact details from Privy user metadata
  useEffect(() => {
    const address = privyUser.customMetadata.address
      ? {
        street: privyUser.customMetadata.address.street ?? undefined,
        city: privyUser.customMetadata.address.city ?? undefined,
        state: privyUser.customMetadata.address.state ?? undefined,
        zipCode: privyUser.customMetadata.address.zipCode ?? undefined,
        country: privyUser.customMetadata.address.country ?? undefined,
      }
      : undefined;
    const formData: ContactDetailsFormData = {
      fullName: privyUser.customMetadata.fullName || '',
      address,
    };
    reset(formData);
  }, [privyUser, reset]);

  const onSubmit = useCallback(
    async (data: ContactDetailsFormData) => {
      try {
        updateMetadata(data);
      } catch (error) {
        console.error('Failed to update contact details:', error);
        toast.error('Failed to update contact details');
      }
    },
    [updateMetadata],
  );

  const emaiSubscriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focus === 'email-subscription') {
      scrollToElement(emaiSubscriptionRef.current);
    }
  }, [focus]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle>Contact Details</CardTitle>
          </div>
          <CardDescription>
            Your contact information for domain registration and account
            management
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-12 mt-6">
          {/* Contact Methods Section */}
          <div className="relative">
            <Card className="pt-6">
              <div className="absolute -top-3 left-4 flex items-center gap-2 bg-card px-2 z-10">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Contact Methods
                </span>
              </div>
              <CardContent className="pt-2 pb-6">
                <ContactAccounts />
              </CardContent>
            </Card>
          </div>
          {/* Email Subscription Settings Section */}
          <div
            ref={emaiSubscriptionRef}
            id="email-subscription"
            className="space-y-12 mt-12"
          >
            <EmailSubscriptionSettings hasEmail={!!privyUser?.email?.address} />
          </div>

          {/* Profile Information Section */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="relative">
              <Card className="pt-6">
                <div className="absolute -top-3 left-4 flex items-center gap-2 bg-card px-2 z-10">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Profile Information
                  </span>
                </div>
                <CardContent className="pt-2 pb-6 space-y-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      {...register('fullName')}
                      placeholder="John Doe"
                      className="max-w-md"
                    />
                    {errors.fullName && (
                      <p className="text-sm text-red-500">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  {/* Address Information */}
                  <div className="space-y-4">
                    <Controller
                      name="address"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="street">Street Address</Label>
                            <Input
                              id="street"
                              value={field.value?.street || ''}
                              onChange={(e) =>
                                field.onChange({
                                  ...field.value,
                                  street: e.target.value,
                                })
                              }
                              placeholder="123 Main Street, Apartment 4B"
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                              <Label htmlFor="city">City</Label>
                              <Input
                                id="city"
                                value={field.value?.city || ''}
                                onChange={(e) =>
                                  field.onChange({
                                    ...field.value,
                                    city: e.target.value,
                                  })
                                }
                                placeholder="New York"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="state">State/Province</Label>
                              <Input
                                id="state"
                                value={field.value?.state || ''}
                                onChange={(e) =>
                                  field.onChange({
                                    ...field.value,
                                    state: e.target.value,
                                  })
                                }
                                placeholder="NY"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                              <Input
                                id="zipCode"
                                value={field.value?.zipCode || ''}
                                onChange={(e) =>
                                  field.onChange({
                                    ...field.value,
                                    zipCode: e.target.value,
                                  })
                                }
                                placeholder="10001"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="country">Country/Region</Label>
                              <CountryDropdown
                                defaultValue={field.value?.country}
                                onChange={(country?: Country) => {
                                  field.onChange({
                                    ...field.value,
                                    country: country?.alpha2,
                                  });
                                }}
                                placeholder="Select country/region"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    />
                    {errors.address && (
                      <p className="text-sm text-red-500">
                        {errors.address.message}
                      </p>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    type="submit"
                    disabled={!isDirty || isUpdatingMetadata}
                    className="ml-auto gap-2"
                  >
                    {isUpdatingMetadata ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Profile
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function scrollToElement(element?: HTMLElement | null | undefined) {
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}
