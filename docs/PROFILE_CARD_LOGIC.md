# ProfileCard Component Logic

## Purpose
Displays user profile information in a visually rich card, used for profile popups and dropdowns.

## Props
- `avatarUrl`, `iconUrl`, `grainUrl`, `miniAvatarUrl` (string): Image URLs
- `name`, `title`, `handle`, `status`, `contactText` (string): User info
- `showUserInfo` (boolean): Show/hide user info section
- `enableTilt` (boolean): Enable 3D tilt effect
- `className` (string): Custom CSS classes
- `onContactClick` (function): Handler for contact button

## Behavior
- Shows avatar, name, title, handle, and status
- Contact button triggers `onContactClick`
- 3D tilt and animated gradients for visual effect
- Used as a floating popup (dropdown) in navigation

## UI
- Responsive, styled with custom CSS
- Can be positioned as a dropdown or modal

---

## Recent Improvements (June 2024)
- No major changes to profile card logic or UI in this cycle. 