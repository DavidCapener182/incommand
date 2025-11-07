export const isSuperadminEmail = (email?: string | null) =>
  !!email && email.toLowerCase() === 'david@incommand.uk';

export type Role = 'superadmin' | 'company_admin' | 'member';

export const deriveRole = (email?: string | null, explicitRole?: Role): Role =>
  isSuperadminEmail(email) ? 'superadmin' : (explicitRole ?? 'member');





