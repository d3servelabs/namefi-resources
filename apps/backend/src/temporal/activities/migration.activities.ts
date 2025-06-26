import { db } from '@namefi-astra/db';
import {
  domainUserPreferencesTable,
  userContactsTable,
  usersTable,
} from '@namefi-astra/db/schema';
import { and, eq } from 'drizzle-orm';
import mongoose from 'mongoose';
import { config, secrets } from '#lib/env';
import { logger } from '#lib/logger';
import { AutoRenewPreference, User } from '../../lib/legacy/db/schemas';
import { privyClient } from '../../trpc/utils';
import { fromPairs, groupBy, isNil, isNotNil, uniqBy } from 'ramda';
import { privyCustomMetadataToPrivyStorage } from '../../trpc/types';

const _logger = logger.child({
  module: 'legacy-users-import',
});

// MongoDB connection
const MONGODB_URI = secrets.LEGACY_DB_URL;

export interface UserMigrationData {
  walletAddress: string;
  stripeCustomerId?: string;
  image?: string;
  createdAt: Date;
  contactDetails?: {
    firstName?: string;
    lastName?: string;
    organizationName?: string;
    phoneNumber?: string;
    phoneNumberVerified?: boolean;
    email?: string;
    emailVerified?: boolean;
    fax?: string;
    addressLines?: string[];
    city?: string;
    contactType?: string;
    countryCode?: string;
    state?: string;
    zipCode?: string;
    extraParams?: any[];
  };
  autoRenewPreferences: Array<{
    domainLdh: string;
    autoRenewOption: string;
  }>;
}

/**
 * Temporal activity to get all users from MongoDB
 * This activity fetches all user wallet addresses from MongoDB
 */
export async function getMongoUsersActivity(): Promise<
  {
    walletAddresses: string[];
    stripeCustomerId?: string;
    contactDetails?: UserMigrationData['contactDetails'];
    primaryEmail?: string;
  }[]
> {
  try {
    _logger.info('Connecting to MongoDB to fetch users...');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);

    // Get all users from MongoDB
    const mongoUsers = (await User.find({})).map((user) => {
      const email = user.contactDetails?.email || undefined;
      const emailVerified = user.contactDetails?.emailVerified || false;
      const primaryEmail = emailVerified ? email : undefined;
      return {
        walletAddresses: [user._id],
        stripeCustomerId: user.stripeCustomerId || undefined,
        contactDetails: {
          firstName: user.contactDetails?.firstName || undefined,
          lastName: user.contactDetails?.lastName || undefined,
          organizationName: user.contactDetails?.organizationName || undefined,
          phoneNumber: user.contactDetails?.phoneNumber || undefined,
          phoneNumberVerified:
            user.contactDetails?.phoneNumberVerified || false,
          email: user.contactDetails?.email || undefined,
          emailVerified: user.contactDetails?.emailVerified || false,
          fax: user.contactDetails?.fax || undefined,
          addressLines: user.contactDetails?.addressLines || undefined,
          city: user.contactDetails?.city || undefined,
          contactType: user.contactDetails?.contactType || undefined,
          countryCode: user.contactDetails?.countryCode || undefined,
          state: user.contactDetails?.state || undefined,
          zipCode: user.contactDetails?.zipCode || undefined,
          extraParams: user.contactDetails?.extraParams || undefined,
        },
        primaryEmail,
      };
    });

    const usersWithPrimaryEmail = mongoUsers.filter((user) =>
      isNotNil(user.primaryEmail),
    );
    const usersWithoutPrimaryEmail = mongoUsers.filter((user) =>
      isNil(user.primaryEmail),
    );

    const groupedByPrimaryEmail = groupBy(
      (user) => user.primaryEmail || '',
      usersWithPrimaryEmail,
    );

    const combinedUsersByPrimaryEmail = Object.values(
      groupedByPrimaryEmail,
    ).flatMap((users) => {
      if (!users || users.length === 0) {
        return [];
      }
      const primaryEmail = users[0].primaryEmail;
      const stripeCustomerId = users[0].stripeCustomerId;
      const contactDetails = users[0].contactDetails;
      return [
        {
          walletAddresses: users.flatMap((user) => user.walletAddresses),
          primaryEmail,
          stripeCustomerId,
          contactDetails,
        },
      ];
    });
    const combinedUsers = [
      ...combinedUsersByPrimaryEmail,
      ...usersWithoutPrimaryEmail,
    ];

    _logger.info(`Found ${combinedUsers.length} distinct users in MongoDB`);

    // Disconnect from MongoDB
    await mongoose.disconnect();

    return combinedUsers;
  } catch (error) {
    _logger.error('Failed to get MongoDB users:', error);
    throw error;
  }
}

export async function getMongoUsersAutoRenewPreferencesActivity(
  walletAddresses: string[],
): Promise<UserMigrationData['autoRenewPreferences']> {
  await mongoose.connect(MONGODB_URI);
  try {
    const autoRenewPrefs = await Promise.all(
      walletAddresses.map(async (walletAddress) => {
        const autoRenewPrefs = await AutoRenewPreference.find({
          _id: { $regex: `^${walletAddress.toLowerCase()}_` },
        });
        return autoRenewPrefs.map((pref: any) => ({
          domainLdh: pref._id.replace(`${walletAddress.toLowerCase()}_`, ''),
          autoRenewOption: pref.autoRenewOption,
        }));
      }),
    );
    return autoRenewPrefs.flat();
  } catch (error) {
    _logger.error('Failed to get MongoDB auto-renew preferences:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

/**
 * Temporal activity to get user data from MongoDB
 */
export async function getUserDataActivity(
  walletAddress: string,
): Promise<UserMigrationData | null> {
  try {
    _logger.info(`Getting user data for wallet: ${walletAddress}`);

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);

    // Get user data
    const user = await User.findById(walletAddress);
    if (!user) {
      _logger.warn(`User not found in MongoDB: ${walletAddress}`);
      await mongoose.disconnect();
      return null;
    }

    // Get auto-renew preferences for this user
    const autoRenewPrefs = await AutoRenewPreference.find({
      _id: { $regex: `^${walletAddress.toLowerCase()}_` },
    });

    const userData: UserMigrationData = {
      walletAddress,
      stripeCustomerId: user.stripeCustomerId || undefined,
      image: user.image || undefined,
      createdAt: user.createdAt,
      contactDetails: user.contactDetails
        ? {
            firstName: user.contactDetails.firstName || undefined,
            lastName: user.contactDetails.lastName || undefined,
            organizationName: user.contactDetails.organizationName || undefined,
            phoneNumber: user.contactDetails.phoneNumber || undefined,
            phoneNumberVerified:
              user.contactDetails.phoneNumberVerified ?? false,
            email: user.contactDetails.email || undefined,
            emailVerified: user.contactDetails.emailVerified ?? false,
            fax: user.contactDetails.fax || undefined,
            addressLines: user.contactDetails.addressLines || undefined,
            city: user.contactDetails.city || undefined,
            contactType: user.contactDetails.contactType || undefined,
            countryCode: user.contactDetails.countryCode || undefined,
            state: user.contactDetails.state || undefined,
            zipCode: user.contactDetails.zipCode || undefined,
            extraParams: user.contactDetails.extraParams || undefined,
          }
        : undefined,
      autoRenewPreferences: autoRenewPrefs.map((pref: any) => ({
        domainLdh: pref._id.replace(`${walletAddress.toLowerCase()}_`, ''),
        autoRenewOption: pref.autoRenewOption,
      })),
    };

    // Disconnect from MongoDB
    await mongoose.disconnect();

    _logger.info(
      `Retrieved user data for ${walletAddress}: ${userData.autoRenewPreferences.length} auto-renew preferences`,
    );
    return userData;
  } catch (error) {
    _logger.error(`Failed to get user data for ${walletAddress}:`, error);
    await mongoose.disconnect();
    throw error;
  }
}

export async function preparePrivyUserAccounts(
  walletAddresses: string[],
  primaryEmail?: string,
) {
  // check if user already exists for wallet address
  const existingUserByWallets = fromPairs(
    await Promise.all(
      walletAddresses.map(async (walletAddress) => {
        const user = await privyClient.getUserByWalletAddress(walletAddress);
        return [walletAddress, user];
      }),
    ),
  );

  _logger.info(`Creating/finding Privy user for wallets: ${walletAddresses}`);
  const newWalletAddresses = walletAddresses.filter(
    (walletAddress) => !existingUserByWallets[walletAddress],
  );
  const existingPrivyIds = Object.values(existingUserByWallets)
    .map((user) => user?.id)
    .filter(isNotNil);

  const existingPrivyUsers = Object.values(existingUserByWallets).filter(
    isNotNil,
  );

  // Build linked accounts array
  const linkedAccounts: any[] = newWalletAddresses.map((walletAddress) => ({
    type: 'wallet',
    chain_type: 'ethereum',
    address: walletAddress,
  }));

  // Add email account if email is provided and verified
  if (primaryEmail) {
    // check if user already exists for email
    const existingUserByEmail = await privyClient.getUserByEmail(primaryEmail);
    if (existingUserByEmail) {
      _logger.info(`User already exists in Privy for email ${primaryEmail}`);

      existingPrivyUsers.push(existingUserByEmail);
      existingPrivyIds.push(existingUserByEmail.id);
      linkedAccounts.push({
        type: 'email',
        address: primaryEmail,
      });
      _logger.info(
        `Including verified email ${primaryEmail} in Privy user creation`,
      );
    }
  }

  if (existingPrivyIds.length > 1) {
    // This case won't happen based on investigation of existing data. so it's dismissed instead of increasing the complexity of the code
    throw new Error(
      `Multiple users already exist in Privy for wallet ${walletAddresses}`,
    );
  }
  const existingPrivyId = existingPrivyIds[0];

  const existingUser = existingPrivyUsers.find(
    (user) => user.id === existingPrivyId,
  );

  if (existingUser) {
    linkedAccounts.push(...(existingUser.linkedAccounts || []));
  }
  const distinctLinkedAccounts = uniqBy(
    (account) => `${account.type}-${account.address}`.toLowerCase(),
    linkedAccounts,
  );

  return {
    linkedAccounts: distinctLinkedAccounts,
    existingPrivyId,
  };
}

/**
 * Temporal activity to create or find Privy user
 */
export async function createPrivyUserActivity(
  linkedAccounts: any[],
  existingPrivyId?: string,
): Promise<{
  privyUserId: string;
  existingPrivyId?: string;
  newUserCreated: boolean;
}> {
  const createNewPrivyUser =
    isNil(existingPrivyId) || (existingPrivyId && linkedAccounts.length > 1);
  if (!createNewPrivyUser) {
    return {
      privyUserId: existingPrivyId,
      existingPrivyId,
      newUserCreated: false,
    };
  }

  try {
    if (existingPrivyId) {
      const deletedUser = await privyClient.deleteUser(existingPrivyId);
      _logger.info(
        `Deleted existing Privy user for wallet ${existingPrivyId}: ${deletedUser}`,
      );
    }

    const response = await fetch('https://auth.privy.io/api/v1/users/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'privy-app-id': config.PRIVY_APP_ID,
        Authorization: `Basic ${Buffer.from(
          `${config.PRIVY_APP_ID}:${secrets.PRIVY_APP_SECRET}`,
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        users: [
          {
            linked_accounts: linkedAccounts,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      _logger.error('Privy API error', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      // For 429 and other errors, let Temporal handle retries
      throw new Error(
        `Privy API failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result = await response.json();

    if (result.results?.[0]?.success) {
      const privyUserId = result.results[0].id;
      _logger.info(`Created new Privy user: ${privyUserId}`);
      return {
        privyUserId,
        existingPrivyId,
        newUserCreated: true,
      };
    }

    const error = result.results?.[0]?.error || 'Unknown error';
    _logger.error(`Failed to create Privy user: ${error}`);
    throw new Error(`Privy user creation failed: ${error}`);
  } catch (error) {
    _logger.error('Failed to create/find Privy user:', error);
    throw error;
  }
}

/**
 * Temporal activity to create PostgreSQL user
 */
export async function createPostgresUserActivity(
  newPrivyUserCreated: boolean,
  newPrivyUserId?: string,
  oldPrivyId?: string,
  _stripeCustomerId?: string,
): Promise<string> {
  try {
    if (!newPrivyUserCreated) {
      if (!oldPrivyId) {
        throw new Error('oldPrivyId is required');
      }
      const existingNamefiUser = await db.query.usersTable.findFirst({
        where: (usersTable, { eq }) => eq(usersTable.privyUserId, oldPrivyId),
      });
      if (!existingNamefiUser) {
        throw new Error(`wrong existingPrivyId provided: ${oldPrivyId}`);
      }
      return existingNamefiUser.id;
    }

    _logger.info(
      `Creating PostgreSQL user for Privy ID: ${newPrivyUserId} ${oldPrivyId ? `replacing existing Privy ID: ${oldPrivyId}` : ''}`,
    );
    if (!newPrivyUserId) {
      throw new Error('newPrivyUserId is required');
    }
    if (oldPrivyId) {
      _logger.info(`oldPrivyId is the same as privyUserId: ${oldPrivyId}`);
      const existingNamefiUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.privyUserId, oldPrivyId),
      });

      if (existingNamefiUser) {
        if (existingNamefiUser.stripeCustomerId && _stripeCustomerId) {
          _logger.info(
            {
              existingNamefiUser,
              _stripeCustomerId,
              newPrivyUserId,
              oldPrivyId,
            },
            `stripeCustomerId already exists for user ${existingNamefiUser.id}, skipping update`,
          );
        }
        await db
          .update(usersTable)
          .set({
            stripeCustomerId:
              existingNamefiUser.stripeCustomerId ||
              _stripeCustomerId ||
              undefined,
            privyUserId: newPrivyUserId,
          })
          .where(eq(usersTable.id, existingNamefiUser.id))
          .returning();
        _logger.info(
          `updated PostgreSQL user ${existingNamefiUser.id} with stripeCustomerId: ${_stripeCustomerId}`,
        );

        return existingNamefiUser.id;
      }
    }

    // Create new user
    const [newUser] = await db
      .insert(usersTable)
      .values({
        privyUserId: newPrivyUserId,
        stripeCustomerId: _stripeCustomerId || undefined,
      })
      .returning();

    _logger.info(`Created new PostgreSQL user: ${newUser.id}`);
    return newUser.id;
  } catch (error) {
    _logger.error(
      `Failed to create PostgreSQL user for Privy ID ${newPrivyUserId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Temporal activity to migrate contact details
 */
export async function migrateContactDetailsActivity(
  userId: string,
  contactDetails?: UserMigrationData['contactDetails'],
): Promise<number> {
  try {
    _logger.info(`Migrating contact details for user: ${userId}`);

    if (!contactDetails) {
      _logger.info(`No contact details to migrate for user ${userId}`);
      return 0;
    }

    // Check if contact details already exist for this user
    const existingContact = await db.query.userContactsTable.findFirst({
      where: eq(userContactsTable.userId, userId),
    });

    if (existingContact) {
      _logger.info(`Contact details already exist for user ${userId}`);
      return 0;
    }

    const user = await db.query.usersTable.findFirst({
      where: (usersTable, { eq }) => eq(usersTable.id, userId),
    });
    if (!user) {
      throw new Error(`User not found in PostgreSQL: ${userId}`);
    }

    const fullName = [contactDetails.firstName, contactDetails.lastName]
      .filter(isNotNil)
      .join(' ')
      .trim();
    const serializedMetadata = privyCustomMetadataToPrivyStorage.parse({
      fullName: fullName || undefined,
      address: {
        street: contactDetails.addressLines?.join(', ') || undefined,
        city: contactDetails.city || undefined,
        state: contactDetails.state || undefined,
        zipCode: contactDetails.zipCode || undefined,
        country: contactDetails.countryCode || undefined,
      },
    });
    await privyClient.setCustomMetadata(user.privyUserId, serializedMetadata);
    // Create contact details record
    await db.insert(userContactsTable).values({
      userId,
      firstName: contactDetails.firstName || undefined,
      lastName: contactDetails.lastName || undefined,
      organizationName: contactDetails.organizationName || undefined,
      phoneNumber: contactDetails.phoneNumber || undefined,
      phoneNumberVerified: contactDetails.phoneNumberVerified,
      email: contactDetails.email || undefined,
      emailVerified: contactDetails.emailVerified,
      fax: contactDetails.fax || undefined,
      addressLines: contactDetails.addressLines
        ? JSON.stringify(contactDetails.addressLines)
        : undefined,
      city: contactDetails.city || undefined,
      contactType: contactDetails.contactType || undefined,
      countryCode: contactDetails.countryCode || undefined,
      state: contactDetails.state || undefined,
      zipCode: contactDetails.zipCode || undefined,
      extraParams: contactDetails.extraParams || undefined,
    });
    _logger.info(`Migrated contact details for user ${userId}`);
    return 1;
  } catch (error) {
    _logger.error(
      `Failed to migrate contact details for user ${userId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Temporal activity to migrate auto-renew preferences
 */
export async function migrateAutoRenewPreferencesActivity(
  userId: string,
  preferences: Array<{ domainLdh: string; autoRenewOption: string }>,
): Promise<number> {
  try {
    _logger.info(`Migrating auto-renew preferences for user: ${userId}`);

    let migratedCount = 0;

    for (const pref of preferences) {
      try {
        // Check if preference already exists for this user and domain
        const existingPref =
          await db.query.domainUserPreferencesTable.findFirst({
            where: and(
              eq(domainUserPreferencesTable.userId, userId),
              eq(
                domainUserPreferencesTable.normalizedDomainName,
                pref.domainLdh as any,
              ),
            ),
          });

        if (existingPref) {
          _logger.info(
            `Auto-renew preference already exists for user ${userId} and domain ${pref.domainLdh}`,
          );
          continue;
        }

        // Create new preference
        await db.insert(domainUserPreferencesTable).values({
          userId,
          normalizedDomainName: pref.domainLdh as any, // Type assertion for now
          autoRenewEnabled: pref.autoRenewOption === 'AUTOMATIC',
        });

        _logger.info(
          `Migrated auto-renew preference for domain ${pref.domainLdh}`,
        );
        migratedCount++;
      } catch (error) {
        _logger.error(
          `Failed to migrate auto-renew preference for domain ${pref.domainLdh}:`,
          error,
        );
      }
    }

    _logger.info(
      `Completed auto-renew preferences migration for user ${userId}: ${migratedCount} migrated`,
    );
    return migratedCount;
  } catch (error) {
    _logger.error(
      `Failed to migrate auto-renew preferences for user ${userId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Temporal activity to validate migration prerequisites
 * Checks if MongoDB and PostgreSQL connections are available
 */
export async function validateMigrationPrerequisitesActivity(): Promise<{
  success: boolean;
  mongodbAvailable: boolean;
  postgresqlAvailable: boolean;
  privyAvailable: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let mongodbAvailable = false;
  let postgresqlAvailable = false;
  let privyAvailable = false;

  try {
    // Test MongoDB connection
    _logger.info('Validating MongoDB connection...');
    await mongoose.connect(MONGODB_URI);
    await mongoose.disconnect();
    mongodbAvailable = true;
    _logger.info('MongoDB connection validated successfully');
  } catch (error) {
    const errorMsg = `MongoDB connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    _logger.error(errorMsg);
    errors.push(errorMsg);
  }

  try {
    // Test PostgreSQL connection
    _logger.info('Validating PostgreSQL connection...');
    // Test by performing a simple query
    await db.select().from(usersTable).limit(1);
    postgresqlAvailable = true;
    _logger.info('PostgreSQL connection validated successfully');
  } catch (error) {
    const errorMsg = `PostgreSQL connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    _logger.error(errorMsg);
    errors.push(errorMsg);
  }

  try {
    // Test Privy connection
    _logger.info('Validating Privy connection...');
    const response = await fetch('https://auth.privy.io/api/v1/users/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'privy-app-id': config.PRIVY_APP_ID,
        Authorization: `Basic ${Buffer.from(
          `${config.PRIVY_APP_ID}:${secrets.PRIVY_APP_SECRET}`,
        ).toString('base64')}`,
      },
      body: JSON.stringify({ users: [] }),
    });

    // If we get a 401 or 400, it means the API is reachable but credentials are wrong
    // If we get a 5xx, it means the service is down
    if (response.status >= 500) {
      throw new Error(`Privy API service error: ${response.status}`);
    }

    privyAvailable = true;
    _logger.info('Privy connection validated successfully');
  } catch (error) {
    const errorMsg = `Privy connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    _logger.error(errorMsg);
    errors.push(errorMsg);
  }

  const success = mongodbAvailable && postgresqlAvailable && privyAvailable;

  return {
    success,
    mongodbAvailable,
    postgresqlAvailable,
    privyAvailable,
    errors,
  };
}

/**
 * Temporal activity to generate migration report
 * Collects statistics about the migration process
 */
export function generateMigrationReportActivity(): Promise<{
  timestamp: string;
  totalUsers: number;
  successfulMigrations: number;
  failedMigrations: number;
  successRate: number;
  estimatedCompletionTime?: string;
}> {
  try {
    _logger.info('Generating migration report...');

    // In a real implementation, you would query the database for actual statistics
    // For now, we'll return a placeholder report
    const report = {
      timestamp: new Date().toISOString(),
      totalUsers: 0,
      successfulMigrations: 0,
      failedMigrations: 0,
      successRate: 0,
    };

    if (report.totalUsers > 0) {
      report.successRate =
        (report.successfulMigrations / report.totalUsers) * 100;
    }

    _logger.info('Migration report generated:', report);
    return Promise.resolve(report);
  } catch (error) {
    _logger.error('Failed to generate migration report:', error);
    throw error;
  }
}
