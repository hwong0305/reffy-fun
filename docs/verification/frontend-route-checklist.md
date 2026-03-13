# Frontend Route Verification Checklist

Date: 2026-03-12

## Public routes
- [x] `/` landing page shows application overview and calls to action
- [x] `/terms` renders US-general starter terms text
- [x] `/privacy` renders US-general starter privacy text

## Authenticated routes
- [x] `/dashboard` requires authentication and shows role metrics
- [x] `/documents` lists owned documents
- [x] `/documents/new` uploads document through create/upload/finalize flow
- [x] `/shares` creates recipient shares, supports filter/search/sort/pagination
- [x] `/writer/approvals` lists pending approvals and allows approve/reject
- [x] `/inbox` lists claim timeline with filter/search/sort/pagination

## Legal and navigation
- [x] Footer includes links to `/terms` and `/privacy`
- [x] Sign-up and sign-in screens link to legal pages
- [x] Legal acceptance is recorded on successful auth flow
