#!/usr/bin/env tsx
import { Command } from 'commander';
import { select, confirm } from '@inquirer/prompts';
import { render } from '@react-email/components';
import { sendMail } from '../mail/mail-client';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';

// Import all templates
import { DomainRenewReport } from '../mail/templates/domain-renew-report';
import { RegisteredDomainSuccessfully } from '../mail/templates/registered-domain-successfully';
import { ProcessedOrderReport } from '../mail/templates/processed-order-report';
import { NftManagementReport } from '../mail/templates/nft-management-report';

const program = new Command();

const DEV_EMAIL = ['dev@namefi.io'];

interface EmailTemplate {
  name: string;
  description: string;
  component: React.ComponentType<any>;
  subject: string;
}

const templates: EmailTemplate[] = [
  {
    name: 'domain-renew-report',
    description:
      'Domain Renew Report - Success/failure report for domain renewals',
    component: DomainRenewReport,
    subject: '[Template Test] Domain Renew Report',
  },
  {
    name: 'registered-domain-successfully',
    description:
      'Registered Domain Successfully - Domain registration success notification',
    component: RegisteredDomainSuccessfully,
    subject: '[Template Test] Registered Domain Successfully',
  },
  {
    name: 'processed-order',
    description:
      'Processed Order - Order processing with items, charges, and refunds',
    component: ProcessedOrderReport,
    subject: '[Template Test] Processed Order',
  },
  {
    name: 'nft-management-report',
    description:
      'NFT Management Report - Daily comprehensive NFT management metrics and health report',
    component: NftManagementReport,
    subject: '[Template Test] NFT Management Daily Report',
  },
];

async function sendTemplate(template: EmailTemplate) {
  try {
    console.log(`\nRendering ${template.name}...`);

    // Render template using react-email
    const element = React.createElement(template.component, {});
    const html = await render(element);
    const text = await render(element, { plainText: true });

    console.log(`Sending ${template.name} to ${DEV_EMAIL[0]}...`);

    await sendMail({
      from: 'support@namefi.io',
      to: DEV_EMAIL,
      subject: template.subject,
      content: { html, plain: text },
    });

    console.log(`✓ ${template.name} sent successfully!`);
  } catch (error) {
    console.error(`✗ Error sending ${template.name}:`, error);
    throw error;
  }
}

async function sendAllTemplates() {
  console.log('Sending all email templates to dev email server...\n');

  for (const template of templates) {
    await sendTemplate(template);
  }

  console.log(`\n🎉 All templates sent successfully to ${DEV_EMAIL[0]}`);
  console.log('Check your dev email server at http://mail.namefi.dev');
}

async function interactiveMode() {
  console.log('Welcome to the Email Templates CLI!\n');

  while (true) {
    const action = await select({
      message: 'What would you like to do?',
      choices: [
        {
          name: 'Send all templates',
          value: 'all',
          description: 'Send all email templates to dev server',
        },
        {
          name: 'Send specific template',
          value: 'specific',
          description: 'Choose a specific template to send',
        },
        {
          name: 'List templates',
          value: 'list',
          description: 'View all available templates',
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
      try {
        await sendAllTemplates();
      } catch (error) {
        console.error('Failed to send all templates:', error);
      }
    }

    if (action === 'specific') {
      const templateChoice = await select({
        message: 'Choose a template to send:',
        choices: templates.map((template) => ({
          name: template.name,
          value: template.name,
          description: template.description,
        })),
      });

      const selectedTemplate = templates.find((t) => t.name === templateChoice);
      if (selectedTemplate) {
        try {
          await sendTemplate(selectedTemplate);
        } catch (error) {
          console.error('Failed to send template:', error);
        }
      }
    }

    if (action === 'list') {
      console.log('\nAvailable email templates:');
      templates.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name}`);
        console.log(`   ${template.description}`);
      });
      console.log('');
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
  .name('email-templates')
  .description(
    'CLI for generating and sending email templates with default values',
  )
  .version('1.0.0');

program
  .command('interactive')
  .description('Interactive mode with arrow key navigation')
  .action(interactiveMode);

program
  .command('send-all')
  .description('Send all email templates to dev email server')
  .action(async () => {
    try {
      await sendAllTemplates();
    } catch (error) {
      console.error('Error sending templates:', error);
      process.exit(1);
    }
  });

program
  .command('send')
  .description('Send a specific template')
  .argument('<template>', 'Template name to send')
  .action(async (templateName: string) => {
    const template = templates.find((t) => t.name === templateName);
    if (!template) {
      console.error(`Template "${templateName}" not found.`);
      console.log('Available templates:');
      templates.forEach((t) => {
        console.log(`  - ${t.name}`);
      });
      process.exit(1);
    }

    try {
      await sendTemplate(template);
    } catch (error) {
      console.error('Error sending template:', error);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all available email templates')
  .action(() => {
    console.log('Available email templates:');
    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name}`);
      console.log(`   ${template.description}`);
    });
  });

// Default to interactive mode if no command is provided
if (process.argv.length === 2) {
  interactiveMode().catch(console.error);
} else {
  program.parse();
}
