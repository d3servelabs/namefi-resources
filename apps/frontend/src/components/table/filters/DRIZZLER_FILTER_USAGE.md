# Drizzler Filter Strategy Usage Guide

This guide shows how to use the new Drizzler-compatible filter strategy that supports complex AND/OR logic with multiple conditions per field.

## Overview

The Drizzler filter strategy provides:
- **Multiple conditions per field** with AND/OR operators
- **Automatic conversion** to `@samyx/drizzler-filters-sorters` format
- **Unified state management** for column and custom filters
- **Type-safe** filter building compatible with `buildWhereClause`

## Basic Usage

```tsx
import { useDrizzlerServerFilterStrategy } from '@/components/table/filters';
import type { FilterOptions } from '@samyx/drizzler-filters-sorters';

function MyTableComponent() {
  const [drizzlerFilter, setDrizzlerFilter] = useState<FilterOptions<any>>();

  const filterStrategy = useDrizzlerServerFilterStrategy({
    filterConfig: {
      // Column filters - columnId matches SQL column name
      email: {
        type: 'text',
        label: 'Email',
      },
      age: {
        type: 'number',
        label: 'Age',
      },
      status: {
        type: 'select',
        label: 'Status',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      },
    },
    onDrizzlerFilterChange: (filter) => {
      setDrizzlerFilter(filter);
      // Use filter with buildWhereClause
      // const whereClause = buildWhereClause(usersTable, filter);
    },
  });

  return (
    <ExtensibleDataTable
      columns={columns}
      data={data}
      filterStrategy={filterStrategy}
      // ... other props
    />
  );
}
```

## With Custom Filters

Custom filters can be added alongside column filters. They're tracked separately but share the same UI:

```tsx
const [searchTerm, setSearchTerm] = useState<string>();

const filterStrategy = useDrizzlerServerFilterStrategy({
  filterConfig: {
    email: { type: 'text', label: 'Email' },
    age: { type: 'number', label: 'Age' },
  },
  customFilters: [
    {
      id: 'globalSearch',
      label: 'Global Search',
      type: 'text',
      value: searchTerm,
      onChange: (value) => setSearchTerm(value as string),
      onClear: () => setSearchTerm(undefined),
    },
  ],
  onDrizzlerFilterChange: (filter) => {
    // This receives only column filters, not custom filters
    console.log('Column filters:', filter);
  },
});
```

## Filter State Structure

The internal state uses this structure:

```typescript
type DrizzlerSingleFilterState = {
  id: string;              // Field ID
  columnId: string;        // SQL column name for buildWhereClause
  conditions: {
    operator: FilterOperators;  // From @samyx/drizzler-filters-sorters
    value: unknown;
  }[];
  logicalOperator: 'and' | 'or';  // How to combine conditions
  custom?: boolean;        // Flag for custom filters
};
```

## Generated Drizzler Format

The strategy automatically converts state to Drizzler `FilterOptions` format:

### Single Condition
```typescript
// State: [{ id: 'email', columnId: 'email', conditions: [{ operator: 'like', value: '@gmail.com' }], logicalOperator: 'and' }]
// Output:
{
  email: { like: '@gmail.com' }
}
```

### Multiple Conditions (AND)
```typescript
// State: [{ id: 'age', columnId: 'age', conditions: [{ operator: 'gte', value: 18 }, { operator: 'lte', value: 65 }], logicalOperator: 'and' }]
// Output:
{
  operator: 'and',
  conditions: [
    { age: { gte: 18 } },
    { age: { lte: 65 } }
  ]
}
```

### Multiple Conditions (OR)
```typescript
// State: [{ id: 'status', columnId: 'status', conditions: [{ operator: 'eq', value: 'active' }, { operator: 'eq', value: 'pending' }], logicalOperator: 'or' }]
// Output:
{
  operator: 'or',
  conditions: [
    { status: { eq: 'active' } },
    { status: { eq: 'pending' } }
  ]
}
```

### Multiple Fields
```typescript
// Multiple fields are always combined with 'and' at the top level
// Output:
{
  operator: 'and',
  conditions: [
    { email: { like: '@gmail.com' } },
    {
      operator: 'and',
      conditions: [
        { age: { gte: 18 } },
        { age: { lte: 65 } }
      ]
    }
  ]
}
```

## Using with Backend

```tsx
// Frontend
const filterStrategy = useDrizzlerServerFilterStrategy({
  filterConfig: {
    email: { type: 'text', label: 'Email' },
    createdAt: { type: 'date', label: 'Created' },
  },
  onDrizzlerFilterChange: (filter) => {
    // Send filter to backend
    fetchData({ filter });
  },
});

// Backend (tRPC/API)
import { buildWhereClause } from '@samyx/drizzler-filters-sorters';

function getUsersQuery(filter: FilterOptions<any>) {
  const whereClause = buildWhereClause(usersTable, filter);

  return db
    .select()
    .from(usersTable)
    .where(whereClause);
}
```

## Supported Operators

The strategy supports all Drizzler operators:

### Text Fields
- `like` - Contains
- `ilike` - Contains (case-insensitive)
- `eq` - Equals
- `neq` - Not Equals
- `isNull` - Is Null
- `isNotNull` - Is Not Null

### Number Fields
- `eq` - Equals
- `neq` - Not Equals
- `gt` - Greater Than
- `gte` - Greater or Equal
- `lt` - Less Than
- `lte` - Less or Equal
- `isNull` - Is Null
- `isNotNull` - Is Not Null

### Date Fields
- `eq` - Equals
- `neq` - Not Equals
- `gt` - After
- `gte` - On or After
- `lt` - Before
- `lte` - On or Before
- `isNull` - Is Null
- `isNotNull` - Is Not Null

### Select Fields
- `eq` - Equals
- `neq` - Not Equals
- `inArray` - In List
- `notInArray` - Not In List
- `isNull` - Is Null
- `isNotNull` - Is Not Null

## UI Features

The filter panel provides:
- **Add/Remove Conditions**: Each field can have multiple conditions
- **AND/OR Toggle**: Switch between logical operators per field
- **Visual Grouping**: Conditions are visually grouped by field
- **Active Count Badge**: Shows number of active conditions per field
- **Clear All**: Remove all filters at once

## Advanced: Manual Conversion

You can manually convert filter state to Drizzler format:

```typescript
import { convertToDrizzlerFilterOptions } from '@/components/table/filters';

const drizzlerFilter = convertToDrizzlerFilterOptions(filterState);
```

## Differences from Basic Strategy

| Feature | Basic Strategy | Drizzler Strategy |
|---------|---------------|-------------------|
| Conditions per field | Single | Multiple |
| AND/OR logic | No | Yes |
| Output format | `{ id, value }[]` | Drizzler `FilterOptions` |
| Operator support | Limited | All Drizzler operators |
| Custom filters | Separate callbacks | Unified state with flag |

## Migration from Basic Strategy

```tsx
// Before (Basic Strategy)
const filterStrategy = useBasicServerFilterStrategy({
  columnFilters,
  onColumnFiltersChange,
  filterConfig: { email: { type: 'text', label: 'Email' } },
});

// After (Drizzler Strategy)
const filterStrategy = useDrizzlerServerFilterStrategy({
  filterConfig: { email: { type: 'text', label: 'Email' } },
  onDrizzlerFilterChange: (filter) => {
    // filter is already in Drizzler format
    // Pass directly to buildWhereClause
  },
});
```
