---
targets:
  - '*'
root: false
description: >-
  Trigger when the user asks to create, edit, or format cursor rules (.mdc
  files), or discusses cursor rule metadata/frontmatter.
globs: []
cursor:
  alwaysApply: false
  description: >-
    Trigger when the user asks to create, edit, or format cursor rules (.mdc
    files), or discusses cursor rule metadata/frontmatter.
---
# Cursor Rules (.mdc) Formatting Standards

## Frontmatter Schema

Every `.mdc` file must have YAML frontmatter with these three fields:

```yaml
---
description: <trigger condition for when this rule applies>
globs:
alwaysApply: false
---
```

### Field Specifications

#### 1. `description:` (Required)
- **Purpose**: Tells the AI when to apply this rule
- **Format**: Single-line string describing the trigger condition
- **Example**: `"Trigger when user asks to create pull requests or mentions graphite"`

#### 2. `globs:` (Required field, usually empty value)
- **Purpose**: File pattern matching for auto-attaching rules to specific files
- **For context-based rules**: Leave blank (no value, no brackets)
- **For file-pattern rules**: Use comma-separated patterns like `"*.ts, *.tsx"`
- **IMPORTANT**: Always include the `globs:` key, even if empty
- **DO NOT use `globs: []`** - bracket syntax can cause parser issues in Cursor
- **Format examples**:
  ```yaml
  # Context-based rule (most common)
  globs:

  # File-pattern rule (less common)
  globs: "*.ts, *.tsx, src/**/*.js"
  ```

#### 3. `alwaysApply:` (Required)
- **Purpose**: Controls if rule applies globally to all contexts
- **Default**: `false` (rule triggers based on `description` matching)
- **Set to `true`**: Only for workspace-wide rules that should always be active
- **Format**: Boolean value

## Rule Types

### Context-Based Rules (Most Common)
Rules that trigger when the AI's context matches the description:
```yaml
---
description: Trigger when agent is working with dates or timestamps
globs:
alwaysApply: false
---
```
- **Use for**: Coding patterns, conventions, workflows, guidelines
- **Example use cases**: UX copywriting, date formatting, git workflows

### File-Pattern Rules (Less Common)
Rules that auto-attach when specific files are in context:
```yaml
---
description: TypeScript-specific linting rules
globs: "*.ts, *.tsx"
alwaysApply: false
---
```
- **Use for**: File-type-specific rules (e.g., all TypeScript files)
- **Pattern syntax**: Comma-separated glob patterns

### Always-Applied Rules (Rare)
Rules that are always active regardless of context:
```yaml
---
description: Core repository performance guidelines
globs:
alwaysApply: true
---
```
- **Use sparingly**: Only for fundamental project-wide constraints
- **Warning**: Can add overhead to every AI interaction

## Best Practices

1. **Keep the 3-field structure**: Even if fields are empty, include all three keys
2. **No brackets for empty globs**: Use `globs:` not `globs: []`
3. **Descriptive descriptions**: Be specific about when the rule should trigger
4. **Prefer context-based**: Most rules should be context-based (empty globs) rather than file-pattern
5. **Location**: Store rules in `.cursor/rules/` directory
6. **File naming**: Use kebab-case: `drafting-cursor-rules.mdc`

## Common Mistakes to Avoid

❌ **Wrong**: Omitting `globs:` entirely
```yaml
---
description: My rule
alwaysApply: false
---
```

❌ **Wrong**: Using array syntax
```yaml
---
description: My rule
globs: []
alwaysApply: false
---
```

❌ **Wrong**: Adding extra/custom fields
```yaml
---
description: My rule
globs:
alwaysApply: false
author: John Doe  # Cursor doesn't recognize this
---
```

✅ **Correct**: Standard 3-field format
```yaml
---
description: Trigger when working on authentication code
globs:
alwaysApply: false
---
```

## Why These Standards?

Based on official Cursor documentation and community forum research (as of Jan 2026):
- Cursor's `.mdc` parser is **not standard YAML** - it has quirks
- Array syntax `[]` causes parsing issues in some Cursor versions
- Blank `globs:` is the most compatible format across versions
- The 3-field structure is what Cursor's UI generates and expects
- Community consensus: stick to this format for reliability

## References

- [Official Cursor Docs - Rules](https://cursor.com/docs/context/rules)
- [Cursor Forum - Rule Frontmatter Format Discussion](https://forum.cursor.com/t/rule-frontmatter-format/146274)
- [Cursor Forum - Deep Dive into Cursor Rules](https://forum.cursor.com/t/a-deep-dive-into-cursor-rules-0-45/60721)
