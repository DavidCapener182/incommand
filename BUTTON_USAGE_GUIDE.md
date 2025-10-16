# Button Component Usage Guide

This guide explains how to use the new standardized Button component throughout the InCommand application.

## Import

```tsx
import { Button } from '@/components/ui/button';
```

## Basic Usage

### Primary Button (Default)
```tsx
<Button onClick={handleClick}>
  Click me
</Button>
```

### Secondary Button
```tsx
<Button variant="secondary" onClick={handleClick}>
  Secondary Action
</Button>
```

### Outline Button
```tsx
<Button variant="outline" onClick={handleClick}>
  Cancel
</Button>
```

### Destructive Button
```tsx
<Button variant="destructive" onClick={handleDelete}>
  Delete
</Button>
```

## Button Variants

| Variant | Use Case | Example |
|---------|----------|---------|
| `primary` | Main actions, confirmations | "Save", "Submit", "Create" |
| `secondary` | Secondary actions | "Back", "Reset" |
| `outline` | Cancel, alternative actions | "Cancel", "Skip" |
| `destructive` | Dangerous actions | "Delete", "Remove" |
| `ghost` | Subtle actions | "View", "Edit" |
| `mono` | High contrast needs | Dark/light mode switches |

## Button Sizes

| Size | Use Case | Height |
|------|----------|--------|
| `xs` | Compact spaces | 28px |
| `sm` | Small actions | 32px |
| `md` | Standard buttons | 36px (default) |
| `lg` | Prominent actions | 40px |
| `icon` | Icon-only buttons | 36px |

## Button Modes

| Mode | Use Case | Description |
|------|----------|-------------|
| `default` | Standard buttons | Normal button behavior |
| `icon` | Icon-only buttons | Square, icon-focused |
| `link` | Text links | Styled as links with hover |

## Common Patterns

### Button with Icon
```tsx
<Button variant="primary" size="md">
  <PlusIcon className="w-4 h-4" />
  Add Item
</Button>
```

### Icon-Only Button
```tsx
<Button variant="outline" size="icon">
  <XMarkIcon className="w-4 h-4" />
</Button>
```

### Loading Button
```tsx
<Button variant="primary" disabled={isLoading}>
  {isLoading ? "Loading..." : "Save Changes"}
</Button>
```

### Full Width Button
```tsx
<Button variant="primary" className="w-full">
  Submit Form
</Button>
```

### Conditional Styling
```tsx
<Button 
  variant={isActive ? "primary" : "outline"}
  onClick={handleToggle}
>
  Toggle State
</Button>
```

## Migration from Old Buttons

### Before (Old HTML buttons)
```tsx
<button 
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  onClick={handleClick}
>
  Click me
</button>
```

### After (New Button component)
```tsx
<Button variant="primary" onClick={handleClick}>
  Click me
</Button>
```

## Best Practices

1. **Always use the Button component** - Never use raw `<button>` elements
2. **Choose appropriate variants** - Use `primary` for main actions, `destructive` for dangerous actions
3. **Consistent sizing** - Use `md` as default, `sm` for compact spaces, `lg` for prominent actions
4. **Accessibility** - The Button component includes proper ARIA attributes and keyboard navigation
5. **Loading states** - Use the `disabled` prop for loading states
6. **Icons** - Always include icons for better UX when appropriate

## Examples by Context

### Form Actions
```tsx
<div className="flex gap-3">
  <Button variant="outline" onClick={onCancel}>
    Cancel
  </Button>
  <Button variant="primary" onClick={onSubmit} disabled={isSubmitting}>
    {isSubmitting ? "Saving..." : "Save Changes"}
  </Button>
</div>
```

### Modal Actions
```tsx
<div className="flex gap-3 pt-4">
  <Button variant="outline" onClick={onClose}>
    Cancel
  </Button>
  <Button variant="destructive" onClick={onDelete}>
    Delete Item
  </Button>
</div>
```

### Toolbar Actions
```tsx
<div className="flex items-center gap-2">
  <Button variant="primary" size="sm">
    <PlusIcon className="w-4 h-4" />
    Add
  </Button>
  <Button variant="outline" size="sm">
    <EditIcon className="w-4 h-4" />
    Edit
  </Button>
  <Button variant="destructive" size="sm">
    <TrashIcon className="w-4 h-4" />
    Delete
  </Button>
</div>
```

## Migration Checklist

When updating existing buttons:

- [ ] Import `Button` from `@/components/ui/button`
- [ ] Replace `<button>` with `<Button>`
- [ ] Remove custom className styling
- [ ] Add appropriate `variant` prop
- [ ] Add appropriate `size` prop if needed
- [ ] Keep `onClick`, `disabled`, and other event handlers
- [ ] Test accessibility and visual appearance

This ensures consistency across the entire application and makes future maintenance easier.
