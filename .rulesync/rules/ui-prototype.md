---
targets:
  - '*'
root: false
description: >-
  Trigger when the user asks for UI prototypes, visual demos, component
  explorations, or design mockups
globs: []
cursor:
  alwaysApply: false
  description: >-
    Trigger when the user asks for UI prototypes, visual demos, component
    explorations, or design mockups
---
# UI Prototype Guidelines

When asked to create UI prototypes, visual demos, or component explorations:

## Location

- Create standalone static HTML files in `prototype/ui/` folder
- Use descriptive filenames like `toggle-variants.html`, `button-states.html`, `modal-designs.html`

## Technical Requirements

- **Standalone**: No dependencies on repo code - must work by opening the HTML file directly in a browser
- **Self-contained**: All CSS should be inline in `<style>` tags
- **CDN-only**: External dependencies (fonts, icons, libraries) should use CDN links only
- **No build step**: Files should work without any compilation or bundling
- **Responsive**: Must work on all screen sizes (Mobile, Tablet, Desktop). Use flexible grids (e.g., `minmax`) and wrapping layouts.

## Design System

- **Dark theme by default**: Use dark backgrounds (`#0a0a0a`, `#141414`) matching the app's aesthetic
- **Font**: Use Inter font from Google Fonts CDN
- **Colors**: Follow the app's color palette:
  - Green (success/safe): `#22c55e`
  - Red (warning/danger): `#ef4444`
  - Yellow (caution): `#eab308`
  - Text primary: `#ffffff`
  - Text secondary: `#a1a1aa`
  - Text muted: `#71717a`
- **Spacing**: Use consistent spacing (multiples of 4px or 8px)
- **Border radius**: Use rounded corners (`8px`, `12px`, `16px`)
- **Transitions**: Add smooth transitions (`0.2s-0.3s ease`)

## Content Language

- **Use English** for all labels, descriptions, and content unless explicitly requested otherwise
- Keep text concise and descriptive

## Page Structure (Like a Figma Presentation)

Organize the prototype like a senior UI/UX designer presenting to a client. The page should flow logically from context → exploration → recommendation:

### 1. Header Section
- **Title**: Clear component/feature name
- **Subtitle**: One-line description of what this prototype explores

### 2. Design Requirements (First Content Section)
A highlighted box explaining the design challenge:
- **Problem**: What user problem or business need are we solving?
- **Goals**: What should this design accomplish?
- **Constraints**: Any technical or UX constraints to consider
- **Success Criteria**: How do we know if the design works?

### 3. Interactive Demo (Hero Section)
- Show the **recommended solution** first as an interactive demo
- **Include a Configurator**: Add a panel to tweak key variables (colors, states, text labels, density)
- **Live Preview**: The demo should update instantly when configuration changes
- **Generated Code**: Optionally show the CSS/JS variables or code snippet for the selected configuration
- This is the "pitch" - what we're proposing, with the ability to "try before you buy"

### 4. Design Exploration (Variants Grid)
- Organize variants by category (e.g., "Prominent", "Subtle", "Minimal")
- Each variant card should include:
  - Visual example (interactive if applicable)
  - Variant name and type label
  - Brief description of when to use
- Use consistent card layout for easy comparison

### 5. Spectrum/Comparison Section
- Visual comparison of all variants side-by-side
- Show the full range from one extreme to another (e.g., "Most Prominent → Most Subtle")
- Helps stakeholders understand the design space

### 6. Use Case Examples
- Real-world scenarios showing the design in context
- "When X happens, use Y variant because Z"
- Include both recommended and not-recommended examples

### 7. Recommendations (Final Section)
- Clear guidance on which variants to use and when
- Organized by use case or priority
- Rationale for each recommendation

## Example HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Component] Design Exploration</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Base styles */
    :root {
      --bg-dark: #0a0a0a;
      --bg-card: #141414;
      --text-primary: #ffffff;
      --text-secondary: #a1a1aa;
      --text-muted: #71717a;
      --green: #22c55e;
      --red: #ef4444;
      --yellow: #eab308;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg-dark);
      color: var(--text-primary);
      padding: 40px 20px;
    }

    .container { max-width: 1100px; margin: 0 auto; }

    /* Design Requirements Box */
    .design-requirements {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
      border: 1px solid rgba(34, 197, 94, 0.2);
      border-radius: 16px;
      padding: 24px 28px;
      margin-bottom: 48px;
    }
    .design-requirements h2 {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--green);
      margin-bottom: 16px;
    }
    .design-requirements dl {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 12px 16px;
    }
    .design-requirements dt {
      font-weight: 600;
      color: var(--text-secondary);
    }
    .design-requirements dd {
      color: var(--text-primary);
      margin: 0;
    }

    /* Section styles */
    .section { margin-bottom: 48px; }
    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .section-desc { color: var(--text-muted); margin-bottom: 20px; }

    /* Card grid */
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }

    /* Comparison section */
    .comparison {
      background: var(--bg-card);
      border-radius: 16px;
      padding: 28px;
    }

    /* Recommendations */
    .recommendations {
      border-left: 3px solid var(--green);
      padding-left: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 1. Header -->
    <h1>[Component] Design Exploration</h1>
    <p class="subtitle">Exploring [specific aspect] for [use case]</p>

    <!-- 2. Design Requirements -->
    <div class="design-requirements">
      <h2>📋 Design Requirements</h2>
      <dl>
        <dt>Problem</dt>
        <dd>What problem are we solving?</dd>
        <dt>Goals</dt>
        <dd>What should this design accomplish?</dd>
        <dt>Constraints</dt>
        <dd>Technical or UX constraints</dd>
        <dt>Success</dt>
        <dd>How do we measure success?</dd>
      </dl>
    </div>

    <!-- 3. Interactive Demo (Recommended Solution) -->
    <div class="section">
      <h2 class="section-title">✨ Recommended Approach</h2>
      <p class="section-desc">Our proposed solution - try it out</p>
      <!-- Interactive demo here -->
    </div>

    <!-- 4. Design Exploration -->
    <div class="section">
      <h2 class="section-title">🎨 Design Variants</h2>
      <p class="section-desc">All explored options organized by category</p>
      <div class="card-grid">
        <!-- Variant cards -->
      </div>
    </div>

    <!-- 5. Spectrum Comparison -->
    <div class="comparison">
      <h3>Full Spectrum: [Dimension A] → [Dimension B]</h3>
      <!-- Side-by-side comparison -->
    </div>

    <!-- 6. Use Case Examples -->
    <div class="section">
      <h2 class="section-title">📱 Real-World Use Cases</h2>
      <!-- Contextual examples -->
    </div>

    <!-- 7. Recommendations -->
    <div class="recommendations">
      <h2 class="section-title">💡 Recommendations</h2>
      <ul>
        <li><strong>For [use case A]:</strong> Use [variant] because [reason]</li>
        <li><strong>For [use case B]:</strong> Use [variant] because [reason]</li>
      </ul>
    </div>
  </div>
</body>
</html>
```

## Workflow

1. **Create** the prototype file in `prototype/ui/`
2. **Open** in browser to demonstrate the design
3. **Present** - walk through the sections from requirements to recommendations
4. **Iterate** based on feedback
5. **Approve** - once finalized, reference when implementing in the codebase
