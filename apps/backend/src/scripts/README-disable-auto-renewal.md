# Disable Auto-Renewal Script

This script disables auto-renewal for all domains across Dynadot and Route53 registrars that currently have auto-renewal enabled.

## Features

- **Dry Run Mode**: Preview changes without executing them
- **Registrar Filtering**: Target specific registrar (Dynadot or Route53)
- **Concurrency Control**: Process multiple domains simultaneously with rate limiting
- **Progress Reporting**: Shows progress for large domain lists
- **Comprehensive Logging**: Detailed logs and summary reports
- **Error Handling**: Robust error handling with detailed error reporting

## Usage

### Basic Usage

```bash
# Run the script (will disable auto-renewal for all domains)
tsx apps/backend/src/scripts/disable-auto-renewal.ts
```

### Dry Run (Recommended First)

```bash
# Preview what changes would be made without executing them
tsx apps/backend/src/scripts/disable-auto-renewal.ts --dry-run
```

### Target Specific Registrar

```bash
# Only process Dynadot domains
tsx apps/backend/src/scripts/disable-auto-renewal.ts --registrar=dynadot

# Only process Route53 domains
tsx apps/backend/src/scripts/disable-auto-renewal.ts --registrar=r53
```

### Control Concurrency

```bash
# Process 10 domains at a time (default is 5)
tsx apps/backend/src/scripts/disable-auto-renewal.ts --concurrency=10
```

### Combined Options

```bash
# Dry run for only Dynadot domains with higher concurrency
tsx apps/backend/src/scripts/disable-auto-renewal.ts --dry-run --registrar=dynadot --concurrency=10
```

## Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Preview changes without executing them | `false` |
| `--registrar=<name>` | Target specific registrar (`dynadot` or `r53`) | All registrars |
| `--concurrency=<number>` | Number of domains to process simultaneously | `5` |
| `--help`, `-h` | Show help message | - |

## How It Works

1. **Fetch Domains**: Retrieves all domains from the specified registrar(s)
2. **Check Status**: Checks the current auto-renewal status for each domain
3. **Filter**: Identifies domains that currently have auto-renewal enabled
4. **Process**: Disables auto-renewal for filtered domains (with concurrency control)
5. **Report**: Generates a comprehensive summary report

## Output

The script provides:
- Real-time progress updates
- Per-domain success/failure status
- Summary report with statistics
- Error details for failed operations
- Results grouped by registrar

Example output:
```
============================================================
SUMMARY REPORT
============================================================
Total domains processed: 150
Successful operations: 148
Failed operations: 2
Already had auto-renewal disabled: 75
Actually changed: 73

Failed domains:
  - example1.com (dynadot): Rate limit exceeded
  - example2.com (r53): Domain not found

By Registrar:
  dynadot: 98/100 successful (2 failed)
  r53: 50/50 successful (0 failed)
============================================================
```

## Safety Features

- **Dry Run Mode**: Always test with `--dry-run` first
- **Rate Limiting**: Built-in concurrency control to avoid API rate limits
- **Error Handling**: Continues processing even if individual domains fail
- **Detailed Logging**: All operations are logged for audit purposes
- **Rollback Information**: Shows previous state for each domain

## Prerequisites

- Proper AWS credentials configured for Route53 access
- Dynadot API keys configured
- All environment variables set up as required by the main registrar service

## Exit Codes

- `0`: All operations completed successfully
- `1`: Some operations failed (check the summary report)

## Troubleshooting

1. **Rate Limit Errors**: Reduce concurrency with `--concurrency=1`
2. **Authentication Errors**: Verify AWS/Dynadot credentials
3. **Network Issues**: The script will retry failed operations automatically
4. **Large Domain Lists**: Use progress reporting to monitor long-running operations

## Related Files

- `apps/backend/src/lib/namefi-registry.ts`: Main registrar service
- `packages/registrars/`: Registrar implementation packages
