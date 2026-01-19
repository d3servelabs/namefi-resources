import { z } from 'zod';

export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().min(2).max(2).optional(),
});

export type Address = z.infer<typeof addressSchema>;

export const privyCustomMetadataSchema = z.object({
  fullName: z.string().optional(),
  address: addressSchema.optional(),
});

export type PrivyCustomMetadata = z.infer<typeof privyCustomMetadataSchema>;

export const privyStorageSchema = z
  .object({
    data: z.string().optional(),
  })
  .optional();

export type PrivyStorage = z.infer<typeof privyStorageSchema>;

export const privyCustomMetadataToPrivyStorage =
  privyCustomMetadataSchema.transform((data) => {
    return {
      data: JSON.stringify(data),
    };
  });

export const privyStorageToPrivyCustomMetadata = privyStorageSchema.transform(
  (data) => {
    return privyCustomMetadataSchema.parse(JSON.parse(data?.data ?? '{}'));
  },
);
