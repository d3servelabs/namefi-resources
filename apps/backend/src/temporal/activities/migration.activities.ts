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
export async function getMongoUsersActivity(): Promise<string[]> {
  try {
    logger.info('Connecting to MongoDB to fetch users...');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);

    // Get all users from MongoDB
    const mongoUsers = await User.find({});
    const walletAddresses = mongoUsers.map((user) => user._id);

    logger.info(`Found ${walletAddresses.length} users in MongoDB`);

    // Disconnect from MongoDB
    await mongoose.disconnect();

    return walletAddresses;
  } catch (error) {
    logger.error('Failed to get MongoDB users:', error);
    throw error;
  }
}

/**
 * Temporal activity to get user data from MongoDB
 */
export async function getUserDataActivity(
  walletAddress: string,
): Promise<UserMigrationData | null> {
  try {
    logger.info(`Getting user data for wallet: ${walletAddress}`);

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);

    // Get user data
    const user = await User.findById(walletAddress);
    if (!user) {
      logger.warn(`User not found in MongoDB: ${walletAddress}`);
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

    logger.info(
      `Retrieved user data for ${walletAddress}: ${userData.autoRenewPreferences.length} auto-renew preferences`,
    );
    return userData;
  } catch (error) {
    logger.error(`Failed to get user data for ${walletAddress}:`, error);
    await mongoose.disconnect();
    throw error;
  }
}

/**
 * Temporal activity to create or find Privy user
 */
export async function createPrivyUserActivity(
  walletAddress: string,
  email?: string,
  emailVerified?: boolean,
): Promise<string> {
  try {
    // check if user already exists for wallet address
    const existingUserByWallet =
      await privyClient.getUserByWalletAddress(walletAddress);
    if (existingUserByWallet) {
      logger.info(`User already exists in Privy for wallet ${walletAddress}`);
      return existingUserByWallet.id;
    }

    logger.info(`Creating/finding Privy user for wallet: ${walletAddress}`);

    // Build linked accounts array
    const linkedAccounts: any[] = [
      {
        type: 'wallet',
        chain_type: 'ethereum',
        address: walletAddress,
      },
    ];

    // Add email account if email is provided and verified
    if (email && emailVerified) {
      // check if user already exists for email
      const existingUserByEmail = await privyClient.getUserByEmail(email);
      if (existingUserByEmail) {
        logger.info(`User already exists in Privy for email ${email}`);
        return existingUserByEmail.id;
      }
      linkedAccounts.push({
        type: 'email',
        address: email,
      });
      logger.info(`Including verified email ${email} in Privy user creation`);
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
      logger.error(`Privy API error for wallet ${walletAddress}:`, {
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
      logger.info(
        `Created new Privy user for wallet ${walletAddress}: ${privyUserId}`,
      );
      return privyUserId;
    }

    const error = result.results?.[0]?.error || 'Unknown error';
    logger.error(
      `Failed to create Privy user for wallet ${walletAddress}: ${error}`,
    );
    throw new Error(`Privy user creation failed: ${error}`);
  } catch (error) {
    logger.error(
      `Failed to create/find Privy user for wallet ${walletAddress}:`,
      error,
    );
    throw error;
  }
}

/**
 * Temporal activity to create PostgreSQL user
 */
export async function createPostgresUserActivity(
  privyUserId: string,
  userData: UserMigrationData,
): Promise<string> {
  try {
    logger.info(`Creating PostgreSQL user for Privy ID: ${privyUserId}`);

    // Check if user already exists
    const existingUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.privyUserId, privyUserId),
    });

    if (existingUser) {
      logger.info(`User already exists in PostgreSQL: ${existingUser.id}`);
      return existingUser.id;
    }

    // Create new user
    const [newUser] = await db
      .insert(usersTable)
      .values({
        privyUserId,
        stripeCustomerId: userData.stripeCustomerId || undefined,
        primaryEmail: userData.contactDetails?.email || undefined,
      })
      .returning();

    logger.info(`Created new PostgreSQL user: ${newUser.id}`);
    return newUser.id;
  } catch (error) {
    logger.error(
      `Failed to create PostgreSQL user for Privy ID ${privyUserId}:`,
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
    logger.info(`Migrating contact details for user: ${userId}`);

    if (!contactDetails) {
      logger.info(`No contact details to migrate for user ${userId}`);
      return 0;
    }

    // Check if contact details already exist for this user
    const existingContact = await db.query.userContactsTable.findFirst({
      where: eq(userContactsTable.userId, userId),
    });

    if (existingContact) {
      logger.info(`Contact details already exist for user ${userId}`);
      return 0;
    }

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

    logger.info(`Migrated contact details for user ${userId}`);
    return 1;
  } catch (error) {
    logger.error(
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
    logger.info(`Migrating auto-renew preferences for user: ${userId}`);

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
          logger.info(
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

        logger.info(
          `Migrated auto-renew preference for domain ${pref.domainLdh}`,
        );
        migratedCount++;
      } catch (error) {
        logger.error(
          `Failed to migrate auto-renew preference for domain ${pref.domainLdh}:`,
          error,
        );
      }
    }

    logger.info(
      `Completed auto-renew preferences migration for user ${userId}: ${migratedCount} migrated`,
    );
    return migratedCount;
  } catch (error) {
    logger.error(
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
    logger.info('Validating MongoDB connection...');
    await mongoose.connect(MONGODB_URI);
    await mongoose.disconnect();
    mongodbAvailable = true;
    logger.info('MongoDB connection validated successfully');
  } catch (error) {
    const errorMsg = `MongoDB connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg);
    errors.push(errorMsg);
  }

  try {
    // Test PostgreSQL connection
    logger.info('Validating PostgreSQL connection...');
    // Test by performing a simple query
    await db.select().from(usersTable).limit(1);
    postgresqlAvailable = true;
    logger.info('PostgreSQL connection validated successfully');
  } catch (error) {
    const errorMsg = `PostgreSQL connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg);
    errors.push(errorMsg);
  }

  try {
    // Test Privy connection
    logger.info('Validating Privy connection...');
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
    logger.info('Privy connection validated successfully');
  } catch (error) {
    const errorMsg = `Privy connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logger.error(errorMsg);
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
    logger.info('Generating migration report...');

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

    logger.info('Migration report generated:', report);
    return Promise.resolve(report);
  } catch (error) {
    logger.error('Failed to generate migration report:', error);
    throw error;
  }
}
