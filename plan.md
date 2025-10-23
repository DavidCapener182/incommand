# Magic Link Fix Implementation Plan

**Overall Progress:** `100%`

## Tasks:

- [x] 🟩 **Step 1: Update invite redemption flows with redirect metadata and usage limits**
  - [x] 🟩 Adjust `/app/api/invite/redeem` to embed invite metadata in the Supabase `redirectTo`, enforce `allow_multiple` with `max_uses`, and log usage status appropriately.
  - [x] 🟩 Mirror the redirect metadata, usage limit, and logging adjustments in `/app/api/invite/direct-auth` so both entry points behave consistently.
  - [x] 🟩 Refine invite usage updates to lock the record when `used_count` reaches `max_uses`, regardless of `allow_multiple`.

- [x] 🟩 **Step 2: Implement robust Supabase user lookup for large tenants**
  - [x] 🟩 Introduce paginated `listUsers` scanning (100-per-page loop) in both invite redemption endpoints to locate existing users by email without missing entries.
  - [x] 🟩 Factor shared lookup logic into a small helper within each route (or shared utility) while respecting current project patterns.

- [x] 🟩 **Step 3: Finalize `/auth/magic-link` client workflow**
  - [x] 🟩 Ensure the page reads `inviteId`, `role`, `eventId`, and `isTemporary` from query params passed via the redirect.
  - [x] 🟩 Detect when automatic Supabase session establishment fails and toggle the manual name/email form accordingly.
  - [x] 🟩 On successful form submission, call `/api/auth/magic-link`, then route users to `/incidents?event=<eventId>`.
  - [x] 🟩 Provide clear UI feedback states (loading, success, error) for both automatic and manual flows.

- [x] 🟩 **Step 4: Align server verification with the updated client**
  - [x] 🟩 Confirm `/app/api/auth/magic-link` validates invite status, updates profiles/memberships with provided name/email, and returns meaningful errors for the UI.
  - [x] 🟩 Remove or consolidate the unused `/app/api/auth/invite-callback` route if it is no longer required.

- [x] 🟩 **Step 5: Verify role-based call-sign handling and read-only restrictions**
  - [x] 🟩 Double-check `useEventMembership` consumers (e.g., incident creation modal/navigation) to ensure read-only members cannot launch incident creation.
  - [x] 🟩 Update the call-sign target mapping so security routes to “Security Control”, medic to “Medic Control”, production to “Production”, and fall back to “Event Control”.

