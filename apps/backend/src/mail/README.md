# Email Templates Guide

This directory contains email templates for the Namefi application using React Email.

## Table of Contents

- [Creating a New Email Template](#creating-a-new-email-template)
- [Template Structure](#template-structure)
- [PoweredByNamefi URL Context](#poweredbynamefi-url-context)
- [Best Practices](#best-practices)
- [Testing Templates](#testing-templates)
- [Common Patterns](#common-patterns)

## Creating a New Email Template

### 1. Basic Template Structure

```tsx
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { GoToDashboard } from '../components/go-to-dashboard';
import { NamefiEmailLinks } from '../email-links';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';

export type YourTemplateProps = {
  // Define your props here
  recipientName: string;
  recipientEmail: string;
  poweredByNamefiDomain?: string | null;
};

export const YourTemplate = (props: YourTemplateProps) => {
  const { recipientName, recipientEmail } = props;
  const poweredByNamefiDomain = usePoweredByNamefiDomain(props.poweredByNamefiDomain);

  return (
    <NamefiEmailContainer
      title="[Namefi] Your Email Subject"
      poweredByNamefiDomain={poweredByNamefiDomain}
    >
      {/* Your email content here */}
      <GoToDashboard />
    </NamefiEmailContainer>
  );
};

// Define preview props for React Email CLI
YourTemplate.PreviewProps = {
  recipientName: 'Alice',
  recipientEmail: 'alice@example.com',
  poweredByNamefiDomain: null,
};

// biome-ignore lint/style/noDefaultExport: required for react-email
export default YourTemplate;
```

### 2. Preview Props Pattern

**Always define PreviewProps after the component definition:**

```tsx
// ✅ Correct - After component definition
YourTemplate.PreviewProps = {
  recipientName: 'Alice',
  recipientEmail: 'alice@example.com',
  poweredByNamefiDomain: null,
};
```

**Don't use the old defaultTo pattern:**

```tsx
// ❌ Incorrect - Old pattern
const defaults = { ... };
const props = defaultTo(defaults, isEmpty(props) ? null : props);
```

## PoweredByNamefi URL Context

### Overview

The `poweredByNamefiDomain` context allows email links to be customized based on the domain that triggered the email. This is essential for white-label functionality and proper attribution.

### Implementation

#### 1. In Template Props

Always include `poweredByNamefiDomain` in your template props:

```tsx
export type YourTemplateProps = {
  // ... other props
  poweredByNamefiDomain?: string | null;
};
```

#### 2. Using the Hook

Use the `usePoweredByNamefiDomain` hook to process the context:

```tsx
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';

export const YourTemplate = (props: YourTemplateProps) => {
  const poweredByNamefiDomain = usePoweredByNamefiDomain(props.poweredByNamefiDomain);
  
  return (
    <NamefiEmailContainer
      poweredByNamefiDomain={poweredByNamefiDomain}
    >
      {/* content */}
    </NamefiEmailContainer>
  );
};
```

#### 3. Email Links with Context

Use `NamefiEmailLinks` for all email links to ensure proper context:

```tsx
import { NamefiEmailLinks } from '../email-links';

// Dashboard link
const dashboardUrl = NamefiEmailLinks.dashboard({ poweredByNamefiDomain });

// Domain settings link
const domainSettingsUrl = NamefiEmailLinks.domainSettings({
  domain: 'example.com',
  poweredByNamefiDomain,
});

// Payment methods link
const paymentMethodsUrl = NamefiEmailLinks.paymentMethods({ poweredByNamefiDomain });
```

#### 4. Custom URLs with Context

For custom URLs, use the `addPoweredByNamefiToUrl` utility:

```tsx
import { addPoweredByNamefiToUrl } from '../components/powered-by-namefi-url-context';

const customUrl = addPoweredByNamefiToUrl('https://example.com/path', poweredByNamefiDomain);
```

## Template Structure

### Required Components

1. **NamefiEmailContainer**: Wraps all email content
2. **GoToDashboard**: Standard call-to-action button (usually at the end)

### Common Imports

```tsx
// React Email components
import { Button, Text } from '@react-email/components';

// Namefi components
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { GoToDashboard } from '../components/go-to-dashboard';
import { Code } from '../components/code';

// Utilities
import { NamefiEmailLinks } from '../email-links';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';

// Markdown support
import ReactMarkdown from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';

// Styling
import { button, paragraph } from '../styles';
```

### Markdown Configuration

For external links, always configure rehype plugins:

```tsx
<ReactMarkdown
  rehypePlugins={[
    [
      rehypeExternalLinks,
      { target: '_blank', rel: ['noopener', 'noreferrer'] },
    ],
  ]}
>
  {markdownContent}
</ReactMarkdown>
```

## Best Practices

### 1. Props Design

- Always include `recipientName` and `recipientEmail` for personalization
- Include `poweredByNamefiDomain` for URL context
- Use descriptive prop names
- Provide proper TypeScript types

### 2. Content Guidelines

- Start emails with personalized greeting: `Hi ${recipientName},`
- Use clear, action-oriented subject lines prefixed with `[Namefi]`
- Include helpful context and next steps
- End with support contact information when appropriate

### 3. URL Handling

- **Always use `NamefiEmailLinks`** for standard Namefi links
- **Never hardcode URLs** - use the email links utilities
- **Include context** - pass `poweredByNamefiDomain` to all link functions
- **Test links** - verify they work with and without context

### 4. Accessibility

- Use semantic HTML elements
- Provide alt text for images
- Ensure sufficient color contrast
- Use descriptive link text

### 5. Responsive Design

- Use table-based layouts for email compatibility
- Test across different email clients
- Use inline styles when necessary
- Keep content width reasonable for mobile

## Testing Templates

### 1. React Email CLI

Preview templates using the React Email development server:

```bash
# From the backend directory
bun run dev:email
```

### 2. Type Checking

Ensure templates pass TypeScript validation:

```bash
bun run typecheck
```

### 3. Preview Props

Always test with realistic preview props:

```tsx
YourTemplate.PreviewProps = {
  recipientName: 'Alice Johnson',
  recipientEmail: 'alice@example.com',
  // Include realistic data that exercises all template features
  domains: ['example.com', 'test.org'],
  poweredByNamefiDomain: null, // Test both null and string values
};
```

## Common Patterns

### 1. Domain Lists

```tsx
{domains.map((domain) => (
  <tr key={domain}>
    <td>{domain}</td>
    <td>
      {punycode.toUnicode(domain) !== domain && 
        `(${punycode.toUnicode(domain)})`
      }
    </td>
  </tr>
))}
```

### 2. Conditional Content

```tsx
{failedItems.length > 0 && (
  <ReactMarkdown>
    {`Some items failed to process. Please contact support@namefi.io.`}
  </ReactMarkdown>
)}
```

### 3. Action Buttons

```tsx
<Button
  style={button}
  href={NamefiEmailLinks.domainSettings({
    domain: domainName,
    poweredByNamefiDomain,
  })}
>
  Manage Domain
</Button>
```

### 4. Tables with Styling

```tsx
<table style={{ borderCollapse: 'collapse', width: '100%' }}>
  <thead>
    <tr>
      <th style={{ 
        border: '1px #D9D9D9 solid', 
        padding: '8px',
        backgroundColor: '#f5f5f5' 
      }}>
        Header
      </th>
    </tr>
  </thead>
  <tbody>
    {/* table content */}
  </tbody>
</table>
```

## File Organization

```
src/mail/
├── README.md                 # This file
├── components/              # Reusable email components
├── templates/              # Email templates
├── email-links.ts          # URL generation utilities
├── consts.ts              # Email constants
└── styles.ts              # Shared styles
```

## Troubleshooting

### Common Issues

1. **PreviewProps not working**: Ensure they're defined after the component
2. **Links not working**: Use `NamefiEmailLinks` instead of hardcoded URLs
3. **TypeScript errors**: Check prop types and imports
4. **Styling issues**: Use inline styles for email compatibility

### Getting Help

- Check existing templates for examples
- Review the React Email documentation
- Contact the development team for complex scenarios
- Test thoroughly across email clients