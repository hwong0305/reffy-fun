# Recommendation Sharing Application Design

## Goal
Build a full-stack application where recommendation letters are uploaded by writers for users, users can share letters only after writer approval per recipient, and recipients must sign in with the invited email to view/download. Transcripts and resumes can be uploaded by users and shared without writer approval.

## Architecture
- Monorepo modular monolith using existing libraries in this repo.
- Backend: Hono + tRPC procedures in `packages/api`, auth via Better Auth.
- Database: Drizzle + SQLite/libSQL (`packages/db`).
- Frontend: React + TanStack Router + React Query in `apps/web`.
- Storage adapter pattern:
  - `DatabaseBlobStorageProvider` implemented now.
  - `S3StorageProvider` contract/stub included for future direct browser upload via pre-signed URLs.

## Core Business Rules
1. Recommendation letters require writer approval for each recipient share.
2. Writer uploads recommendation letters for a specific user.
3. Recipients can access letters only after:
   - writer approval exists for that share, and
   - recipient account email exactly matches invited email.
4. Transcripts/resumes do not require writer approval.
5. All share/approval/download actions are auditable.

## Data Model
Add domain tables in DB schema:
- `documents`: metadata for all uploaded files.
- `recommendation_requests`: writer-to-subject linkage for recommendation docs.
- `recipient_shares`: per-document per-email share state.
- `writer_approvals`: writer decision for a specific share.
- `document_access_grants`: effective recipient access records.
- `audit_events`: immutable event trail.

## API Flows
### Upload
1. `createUploadTarget` (S3-shaped response contract).
2. `uploadBytes` (DB-mode implementation now).
3. `finalizeUpload` (persist metadata + relationships).

### Share and Approval
1. User creates share to recipient email.
2. For recommendation letters, share status starts `pending_writer_approval`.
3. Writer approves/rejects per share.
4. Recipient signs in and claims share by exact email match.
5. Access grant is created when requirements are satisfied.

### Download
- Recipient/owner requests download target.
- Authorization checks ownership/grants.
- DB mode returns streamed content; future S3 mode returns pre-signed GET target.

## Frontend Routes
Public:
- `/` landing page explaining workflow and trust model.
- `/terms` Terms of Use (US-general starter template).
- `/privacy` Privacy Policy (US-general starter template).

Authenticated app pages:
- `/dashboard`
- `/documents`
- `/documents/new`
- `/shares`
- `/writer/approvals`
- `/inbox`

## Legal and Compliance
- Add legal footer links on landing/auth/app shell.
- Capture terms/privacy version acceptance metadata at account creation or first authenticated flow.

## S3 Migration Strategy
- Keep storage behavior behind `FileStorageProvider`.
- Maintain current API shape so migration swaps provider implementation rather than route contracts.
- Future direct upload path:
  - backend returns pre-signed PUT URL,
  - browser uploads directly to S3,
  - backend finalizes metadata.

## Testing Strategy
- Unit and integration tests for:
  - authorization matrix (owner/writer/recipient),
  - recommendation approval gating,
  - exact-email claim behavior,
  - transcript/resume no-approval sharing,
  - upload/finalize/download flows.
- Frontend route checks for public legal pages and core user flows.
