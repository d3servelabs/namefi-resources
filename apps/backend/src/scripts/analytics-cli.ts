#!/usr/bin/env tsx
/**
 * Interactive CLI for Google Analytics 4 data retrieval and analysis
 *
 * Usage:
 *   # Interactive mode (default)
 *   bun run command:analytics
 *
 *   # Execute specific method
 *   bun run command:analytics execute getTopDomains
 *
 *   # List all available methods
 *   bun run command:analytics list
 *
 *   # Execute all methods with default parameters
 *   bun run command:analytics all
 *
 * Environment Variables Required:
 *   GA4_PROPERTY_ID - Google Analytics 4 Property ID
 *   GA4_KEY_FILE_PATH - Path to Google Cloud service account key file
 */
import { Command } from 'commander';
import { select, confirm, input } from '@inquirer/prompts';
import {
  createGA4Client,
  type DateRange,
  type AnalyticsConfig,
} from '../lib/analytics_client';
import { secrets } from '../lib/env';
import { parseDnsAnalyticsReportData } from '../lib/analytics-parser';
import {
  getDashboardOverview,
  getFullReportByRecordName,
} from '../trpc/routers/analyticsRouter';

const program = new Command();

interface AnalyticsMethod {
  name: string;
  description: string;
  method: keyof ReturnType<typeof createGA4Client>;
  defaultParams?: any[];
  /**
   * @default true
   * If true, the date range will be prompted for.
   * If false, the date range will be set to the default.
   */
  promptForDateRange?: boolean;
  paramPrompts?: Array<{
    name: string;
    message: string;
    type: 'input' | 'number';
    default?: any;
  }>;
}

const analyticsMethods: AnalyticsMethod[] = [
  {
    name: 'createCustomDimensions',
    description: 'Create all required custom dimensions for DNS analytics',
    method: 'createCustomDimensions',
    promptForDateRange: false,
  },
  {
    name: 'getTopDomains',
    description: 'Get top domains by DNS query count',
    method: 'getTopDomains',
    paramPrompts: [
      {
        name: 'limit',
        message: 'Number of domains to retrieve:',
        type: 'number',
        default: 50,
      },
    ],
  },
  {
    name: 'getQueriesByResponseCode',
    description:
      'Get DNS queries grouped by response code (NOERROR, NXDOMAIN, etc.)',
    method: 'getQueriesByResponseCode',
  },
  {
    name: 'getQueriesByType',
    description: 'Get DNS queries grouped by query type (A, AAAA, MX, etc.)',
    method: 'getQueriesByType',
  },
  {
    name: 'getCacheHitRatio',
    description: 'Get cache hit/miss statistics',
    method: 'getCacheHitRatio',
  },
  {
    name: 'getQueriesByCountry',
    description: 'Get DNS queries grouped by country',
    method: 'getQueriesByCountry',
    paramPrompts: [
      {
        name: 'limit',
        message: 'Number of countries to retrieve:',
        type: 'number',
        default: 20,
      },
    ],
  },
  {
    name: 'getDnssecStats',
    description: 'Get DNSSEC validation statistics',
    method: 'getDnssecStats',
  },
  {
    name: 'getResponseSizeDistribution',
    description: 'Get DNS response size distribution over time',
    method: 'getResponseSizeDistribution',
  },
  {
    name: 'getTopClientIps',
    description: 'Get top client IP addresses by query count',
    method: 'getTopClientIps',
    paramPrompts: [
      {
        name: 'limit',
        message: 'Number of IPs to retrieve:',
        type: 'number',
        default: 100,
      },
    ],
  },
  {
    name: 'getQueriesByDomainPattern',
    description: 'Get DNS queries filtered by domain pattern',
    method: 'getQueriesByDomainPattern',
    paramPrompts: [
      {
        name: 'pattern',
        message: 'Domain pattern to search for:',
        type: 'input',
        default: '.com',
      },
    ],
  },
  {
    name: 'getTtlDistribution',
    description: 'Get TTL distribution for DNS responses',
    method: 'getTtlDistribution',
    paramPrompts: [
      {
        name: 'minEvents',
        message: 'Minimum event count for TTL values:',
        type: 'number',
        default: 10,
      },
    ],
  },
  {
    name: 'getByPublicSuffix',
    description: 'Get DNS queries grouped by public suffix (TLD)',
    method: 'getByPublicSuffix',
    paramPrompts: [
      {
        name: 'limit',
        message: 'Number of public suffixes to retrieve:',
        type: 'number',
        default: 50,
      },
    ],
  },
  {
    name: 'getByPublicSuffixPlusOne',
    description: 'Get DNS queries grouped by public suffix plus one label',
    method: 'getByPublicSuffixPlusOne',
    paramPrompts: [
      {
        name: 'limit',
        message: 'Number of domains to retrieve:',
        type: 'number',
        default: 50,
      },
    ],
  },
  {
    name: 'getHourlyQueryVolume',
    description: 'Get hourly DNS query volume over time',
    method: 'getHourlyQueryVolume',
  },
  {
    name: 'getDailyQueryVolume',
    description: 'Get daily DNS query volume over time',
    method: 'getDailyQueryVolume',
  },
  {
    name: 'getQueryLatency',
    description: 'Get DNS query latency statistics by query type',
    method: 'getQueryLatency',
  },
  {
    name: 'getErrorRateByDomain',
    description: 'Get error rates grouped by domain (non-NOERROR responses)',
    method: 'getErrorRateByDomain',
    paramPrompts: [
      {
        name: 'limit',
        message: 'Number of domains to retrieve:',
        type: 'number',
        default: 50,
      },
    ],
  },
  {
    name: 'getTopDomainsWithDetails',
    description: 'Get top domains with query type and response code details',
    method: 'getTopDomainsWithDetails',
    paramPrompts: [
      {
        name: 'limit',
        message: 'Number of domains to retrieve:',
        type: 'number',
        default: 50,
      },
    ],
  },
];
let client: ReturnType<typeof createGA4Client>;

// Initialize GA4 client
function createClient(): ReturnType<typeof createGA4Client> {
  if (client) {
    return client;
  }

  if (!secrets.GA4_PROPERTY_ID) {
    throw new Error('GA4_PROPERTY_ID environment variable is required');
  }

  const config: AnalyticsConfig = {
    propertyId: secrets.GA4_PROPERTY_ID,
    keyFilename: secrets.GA4_KEY_FILE_PATH,
  };

  client = createGA4Client(config);
  return client;
}

async function promptDateRange(): Promise<DateRange> {
  const preset = await select({
    message: 'Choose a date range:',
    choices: [
      { name: 'Last 7 days', value: '7days' },
      { name: 'Last 30 days', value: '30days' },
      { name: 'Yesterday', value: '1day' },
      { name: 'Last hour', value: '1hour' },
      { name: 'Custom range', value: 'custom' },
    ],
  });

  switch (preset) {
    case '7days':
      return { startDate: '7daysAgo', endDate: 'today' };
    case '30days':
      return { startDate: '30daysAgo', endDate: 'today' };
    case '1day':
      return { startDate: '1daysAgo', endDate: 'today' };
    case '1hour':
      return { startDate: '1hoursAgo', endDate: 'now' };
    case 'custom': {
      const startDate = await input({
        message: 'Start date (YYYY-MM-DD or relative like "7daysAgo"):',
        default: '7daysAgo',
      });
      const endDate = await input({
        message: 'End date (YYYY-MM-DD or relative like "today"):',
        default: 'today',
      });
      return { startDate, endDate };
    }
    default:
      return { startDate: '7daysAgo', endDate: 'today' };
  }
}

async function formatAndDisplayResults(methodName: string, response: any) {
  console.log(`\n📊 Results for ${methodName}:\n`);

  if (!response.rows || response.rows.length === 0) {
    console.log('No data found for the specified criteria.');
    return;
  }

  // Prepare headers
  const headers: string[] = [];
  if (response.dimensionHeaders) {
    headers.push(...response.dimensionHeaders.map((h: any) => h.name));
  }
  if (response.metricHeaders) {
    headers.push(...response.metricHeaders.map((h: any) => h.name));
  }

  // Convert response to table format
  const tableData = response.rows
    .slice(0, 50)
    .map((row: any, index: number) => {
      const rowData: any = { '#': index + 1 };

      // Add dimension values
      if (row.dimensionValues && response.dimensionHeaders) {
        response.dimensionHeaders.forEach((header: any, i: number) => {
          rowData[header.name] = row.dimensionValues[i]?.value || 'N/A';
        });
      }

      // Add metric values
      if (row.metricValues && response.metricHeaders) {
        response.metricHeaders.forEach((header: any, i: number) => {
          const value = row.metricValues[i]?.value || '0';
          // Format large numbers with commas
          rowData[header.name] = Number.isNaN(Number(value))
            ? value
            : Number(value).toLocaleString();
        });
      }

      return rowData;
    });

  console.table(tableData);

  if (response.rows.length > 50) {
    console.log(`\n... and ${response.rows.length - 50} more rows not shown`);
  }

  console.log(`\nTotal rows: ${response.rows.length}`);
  console.log(`Query executed: ${new Date().toISOString()}`);
}

async function executeMethod(method: AnalyticsMethod) {
  try {
    console.log(`\n🔍 Executing: ${method.name}`);
    console.log(`Description: ${method.description}\n`);

    const client = createClient();
    let dateRange: DateRange;
    if (method.promptForDateRange !== false) {
      dateRange = await promptDateRange();
    } else {
      dateRange = { startDate: '7daysAgo', endDate: 'today' };
    }

    // Collect additional parameters if needed
    const params: any[] = [dateRange];

    if (method.paramPrompts) {
      for (const prompt of method.paramPrompts) {
        let value: any;
        if (prompt.type === 'number') {
          const inputValue = await input({
            message: prompt.message,
            default: prompt.default?.toString(),
          });
          value = Number.parseInt(inputValue, 10);
        } else {
          value = await input({
            message: prompt.message,
            default: prompt.default,
          });
        }
        params.push(value);
      }
    }

    console.log('\n⏳ Querying Google Analytics...');

    // Execute the method with proper typing
    const methodFn = client[method.method] as (...args: any[]) => Promise<any>;
    const response = await methodFn.apply(client, params);

    await formatAndDisplayResults(method.name, response);
  } catch (error) {
    console.error(`\n❌ Error executing ${method.name}:`, error);
    if (error instanceof Error) {
      console.error(`Details: ${error.message}`);
    }
  }
}

async function executeAllMethods() {
  console.log(
    '🚀 Executing all analytics methods with default parameters...\n',
  );

  const dateRange = await promptDateRange();
  const client = createClient();

  for (const method of analyticsMethods) {
    try {
      console.log(`\n📊 Running ${method.name}...`);

      const params = [dateRange];

      // Add default parameters for methods that need them
      if (method.paramPrompts) {
        for (const prompt of method.paramPrompts) {
          params.push(prompt.default);
        }
      }

      const methodFn = client[method.method] as (
        ...args: any[]
      ) => Promise<any>;
      const response = await methodFn.apply(client, params);

      console.log(`✓ ${method.name}: ${response.rows?.length || 0} rows`);
    } catch (error) {
      console.error(
        `✗ ${method.name}: Error -`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log('\n🎉 All methods executed!');
}

async function interactiveMode() {
  console.log('Welcome to the Google Analytics CLI! 📊\n');

  while (true) {
    const action = await select({
      message: 'What would you like to do?',
      choices: [
        {
          name: 'Execute specific method',
          value: 'specific',
          description: 'Choose a specific analytics method to run',
        },
        {
          name: 'Execute all methods',
          value: 'all',
          description: 'Run all analytics methods with default parameters',
        },
        {
          name: 'List available methods',
          value: 'list',
          description: 'View all available analytics methods',
        },
        {
          name: 'Check configuration',
          value: 'config',
          description: 'Verify Google Analytics configuration',
        },
        {
          name: 'Exit',
          value: 'exit',
          description: 'Exit the CLI',
        },
      ],
    });

    if (action === 'exit') {
      console.log('Goodbye! 👋');
      break;
    }

    if (action === 'all') {
      await executeAllMethods();
    }

    if (action === 'specific') {
      const methodChoice = await select({
        message: 'Choose an analytics method:',
        choices: analyticsMethods.map((method) => ({
          name: method.name,
          value: method.name,
          description: method.description,
        })),
      });

      const selectedMethod = analyticsMethods.find(
        (m) => m.name === methodChoice,
      );
      if (selectedMethod) {
        await executeMethod(selectedMethod);
      }
    }

    if (action === 'list') {
      console.log('\n📋 Available analytics methods:\n');
      analyticsMethods.forEach((method, index) => {
        console.log(`${index + 1}. ${method.name}`);
        console.log(`   ${method.description}`);
        if (method.paramPrompts) {
          console.log(
            `   Parameters: ${method.paramPrompts.map((p) => p.name).join(', ')}`,
          );
        }
        console.log('');
      });
    }

    if (action === 'config') {
      console.log('\n🔧 Google Analytics Configuration:');
      console.log(
        `Property ID: ${secrets.GA4_PROPERTY_ID || 'Not configured'}`,
      );
      console.log(`Key File: ${secrets.GA4_KEY_FILE_PATH || 'Not configured'}`);

      try {
        createClient();
        console.log('✓ Client initialized successfully');
      } catch (error) {
        console.error(
          '✗ Client initialization failed:',
          error instanceof Error ? error.message : error,
        );
      }
    }

    // Ask if user wants to continue
    const continueChoice = await confirm({
      message: 'Do you want to perform another action?',
      default: true,
    });

    if (!continueChoice) {
      console.log('Goodbye! 👋');
      break;
    }
  }
}

program
  .name('analytics-cli')
  .description('CLI for Google Analytics 4 data retrieval and analysis')
  .version('1.0.0');

program
  .command('interactive')
  .description('Interactive mode with menu navigation')
  .action(interactiveMode);

program
  .command('execute')
  .description('Execute a specific analytics method')
  .argument('<method>', 'Method name to execute')
  .action(async (methodName: string) => {
    const method = analyticsMethods.find((m) => m.name === methodName);
    if (!method) {
      console.error(`Method "${methodName}" not found.`);
      console.log('Available methods:');
      analyticsMethods.forEach((m) => {
        console.log(`  - ${m.name}`);
      });
      process.exit(1);
    }

    await executeMethod(method);
  });

program
  .command('list')
  .description('List all available analytics methods')
  .action(() => {
    console.log('📋 Available analytics methods:\n');
    analyticsMethods.forEach((method, index) => {
      console.log(`${index + 1}. ${method.name}`);
      console.log(`   ${method.description}`);
      if (method.paramPrompts) {
        console.log(
          `   Parameters: ${method.paramPrompts.map((p) => p.name).join(', ')}`,
        );
      }
      console.log('');
    });
  });

program
  .command('all')
  .description('Execute all analytics methods with default parameters')
  .action(executeAllMethods);

// Example: Demonstrate backend parsing helper
program
  .command('example:parsed-report')
  .description(
    'Example that fetches dashboard/full report and parses it to a frontend-friendly shape',
  )
  .option(
    '--startDate <startDate>',
    'Start date (YYYY-MM-DD or relative)',
    '7daysAgo',
  )
  .option('--endDate <endDate>', 'End date (YYYY-MM-DD or relative)', 'today')
  .option(
    '--domain <domain>',
    'Optional domain to filter by (uses full report)',
  )
  .option(
    '--includeIps',
    'Include top client IPs table in the output summary',
    false,
  )
  .action(
    async (opts: {
      startDate: string;
      endDate: string;
      domain?: string;
      includeIps?: boolean;
    }) => {
      try {
        const dateRange: DateRange = {
          startDate: opts.startDate,
          endDate: opts.endDate,
        };

        const raw = opts.domain
          ? await getFullReportByRecordName({
              ...dateRange,
              domainName: opts.domain,
            })
          : await getDashboardOverview({ ...dateRange });

        const parsed = parseDnsAnalyticsReportData(raw as any);

        // Print concise summary
        console.log('\nParsed DNS Analytics Summary');
        console.log('============================');
        console.log(
          `Total Queries: ${parsed.summary.totalQueries.toLocaleString()}`,
        );
        console.log(
          `Unique Domains: ${parsed.summary.uniqueDomains.toLocaleString()}`,
        );
        console.log(
          `Unique Client IPs: ${parsed.summary.uniqueClientIps.toLocaleString()}`,
        );
        console.log(
          `Cache Hit Rate: ${parsed.summary.cacheHitRatePercent == null ? 'N/A' : parsed.summary.cacheHitRatePercent.toFixed(1) + '%'} `,
        );

        // Top 10 domains
        const topDomains = parsed.topDomains.slice(0, 10);
        if (topDomains.length) {
          console.log('\nTop Domains:');
          console.table(
            topDomains.map((d, i) => ({
              '#': i + 1,
              domain: d.domain,
              count: d.count,
            })),
          );
        }

        // Response codes
        const rcodes = parsed.queriesByResponseCode.slice(0, 10);
        if (rcodes.length) {
          console.log('\nQueries by Response Code:');
          console.table(
            rcodes.map((r) => ({ rcode: r.rcode, count: r.count })),
          );
        }

        // Daily volume
        const daily = parsed.dailyVolume.slice(0, 10);
        if (daily.length) {
          console.log('\nDaily Volume (first 10):');
          console.table(daily.map((d) => ({ date: d.date, count: d.count })));
        }

        // Optional: Top Client IPs
        if (opts.includeIps) {
          const ips = parsed.topClientIps.slice(0, 10);
          if (ips.length) {
            console.log('\nTop Client IPs:');
            console.table(
              ips.map((i, idx) => ({ '#': idx + 1, ip: i.ip, count: i.count })),
            );
          }
        }

        // Public suffix
        const suffixes = parsed.publicSuffix.slice(0, 10);
        if (suffixes.length) {
          console.log('\nPublic Suffix:');
          console.table(
            suffixes.map((s) => ({
              publicSuffix: s.publicSuffix,
              count: s.count,
            })),
          );
        }

        console.log('\nDone.');
      } catch (error) {
        console.error('Error running parsed-report example:', error);
        process.exitCode = 1;
      }
    },
  );

// Default to interactive mode if no command is provided
if (process.argv.length === 2) {
  interactiveMode().catch(console.error);
} else {
  program.parse();
}
