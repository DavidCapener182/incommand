/**
 * Shared application constants.
 * Use these for breakpoints and magic numbers to ensure consistency.
 */

/** Emails allowed to access the back office (/admin). Must also have admin/superadmin role. */
export const ALLOWED_BACK_OFFICE_EMAILS = [
  'david@incommand.uk',
  'david.capener@compactsecurity.co.uk',
] as const;

/** Tailwind md breakpoint - use for mobile/desktop split (screens below this are "mobile") */
export const MOBILE_BREAKPOINT_PX = 768;

/** Media query string for mobile (max-width) */
export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`;
