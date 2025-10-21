# Tab Navigation Component

A reusable tabbed navigation component that matches the design system used across the application.

## CSS Classes

### Container
```css
.tab-navigation
```
- Creates the main tab container with backdrop blur and rounded corners
- Semi-transparent background with subtle shadow

### Tab Items
```css
.tab-navigation-item
```
- Base styling for individual tab buttons
- Includes padding, rounded corners, and transitions

### Active State
```css
.tab-navigation-item-active
```
- Blue background with blue text
- Used for the currently selected tab

### Inactive State
```css
.tab-navigation-item-inactive
```
- Gray text with hover effects
- Transitions to blue on hover

## Usage Examples

### 1. Using CSS Classes Directly
```tsx
<div className="tab-navigation">
  <button className="tab-navigation-item tab-navigation-item-active">
    <span className="flex-shrink-0">📊</span>
    Active Tab
  </button>
  <button className="tab-navigation-item tab-navigation-item-inactive">
    <span className="flex-shrink-0">⚙️</span>
    Inactive Tab
  </button>
</div>
```

### 2. Using the React Component
```tsx
import TabNavigation from '@/components/ui/TabNavigation'

const tabs = [
  { id: 'tab1', label: 'Tab 1', icon: <SomeIcon /> },
  { id: 'tab2', label: 'Tab 2', icon: <AnotherIcon /> },
]

<TabNavigation
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

### 3. With State Management
```tsx
const [activeTab, setActiveTab] = useState('tab1')

const handleTabChange = (tabId: string) => {
  setActiveTab(tabId)
  // Additional logic here
}
```

## Design Features

- **Backdrop Blur**: Semi-transparent background with blur effect
- **Rounded Corners**: Consistent `rounded-2xl` for container, `rounded-xl` for tabs
- **Hover Effects**: Smooth transitions on hover
- **Dark Mode**: Full dark mode support
- **Responsive**: Flexbox layout that wraps on smaller screens
- **Accessibility**: Proper button semantics and keyboard navigation

## Customization

You can extend the base classes:

```css
.custom-tab-navigation {
  @apply tab-navigation;
  /* Add custom styles */
}

.custom-tab-item {
  @apply tab-navigation-item;
  /* Add custom styles */
}
```

## Integration

This component is used in:
- Staffing Centre navigation
- Analytics dashboard tabs
- Any page requiring tabbed navigation

The CSS classes ensure consistent styling across the entire application.
