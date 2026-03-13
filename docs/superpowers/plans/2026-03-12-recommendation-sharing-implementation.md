# Recommendation Sharing Application Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a recommendation-sharing full stack app with per-recipient writer approvals, recipient account-gated access, transcript/resume sharing without approval, and public landing/legal pages.

**Architecture:** Extend the existing Hono+tRPC monorepo with domain-focused schema, routers, and UI routes. Introduce a storage provider contract that runs on DB BLOB storage now and keeps an S3-compatible flow contract for future pre-signed direct uploads.

**Tech Stack:** Bun, TypeScript, Hono, tRPC, Better Auth, Drizzle ORM, SQLite/libSQL, React, TanStack Router, React Query, Tailwind.

---

## Chunk 1: Database and Storage Contracts

### Task 1: Add domain schema tables

**Files:**
- Create: `packages/db/src/schema/documents.ts`
- Modify: `packages/db/src/schema/index.ts`
- Test: `packages/db/src/schema/documents.test.ts`

- [ ] **Step 1: Write the failing test**
Add tests for table definitions and enum/status safety checks.

- [ ] **Step 2: Run test to verify it fails**
Run: `bun test packages/db/src/schema/documents.test.ts`
Expected: FAIL because new schema is not implemented.

- [ ] **Step 3: Write minimal implementation**
Implement `documents`, `recommendationRequests`, `recipientShares`, `writerApprovals`, `documentAccessGrants`, `auditEvents`.

- [ ] **Step 4: Run test to verify it passes**
Run: `bun test packages/db/src/schema/documents.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/db/src/schema/documents.ts packages/db/src/schema/index.ts packages/db/src/schema/documents.test.ts
git commit -m "feat(db): add recommendation sharing schema"
```

### Task 2: Add storage provider abstraction (DB now, S3-ready)

**Files:**
- Create: `packages/api/src/storage/provider.ts`
- Create: `packages/api/src/storage/database-blob-provider.ts`
- Create: `packages/api/src/storage/s3-provider.ts`
- Create: `packages/api/src/storage/index.ts`
- Test: `packages/api/src/storage/provider.test.ts`

- [ ] **Step 1: Write the failing test**
Define provider contract behavior tests.

- [ ] **Step 2: Run test to verify it fails**
Run: `bun test packages/api/src/storage/provider.test.ts`
Expected: FAIL due missing provider implementation.

- [ ] **Step 3: Write minimal implementation**
Implement `FileStorageProvider` API and DB provider; add S3 stub implementation with explicit not-implemented errors.

- [ ] **Step 4: Run test to verify it passes**
Run: `bun test packages/api/src/storage/provider.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

## Chunk 2: Backend tRPC Flows

### Task 3: Documents router

**Files:**
- Create: `packages/api/src/routers/documents.ts`
- Modify: `packages/api/src/routers/index.ts`
- Test: `packages/api/src/routers/documents.test.ts`

- [ ] **Step 1: Write the failing test**
Cover upload target, finalize, list owned docs, list inbox, and download authorization.

- [ ] **Step 2: Run test to verify it fails**
Run: `bun test packages/api/src/routers/documents.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**
Implement documents procedures with protected access checks.

- [ ] **Step 4: Run test to verify it passes**
Run: `bun test packages/api/src/routers/documents.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

### Task 4: Shares router

**Files:**
- Create: `packages/api/src/routers/shares.ts`
- Modify: `packages/api/src/routers/index.ts`
- Test: `packages/api/src/routers/shares.test.ts`

- [ ] **Step 1: Write the failing test**
Cover share creation rules and exact-email claim binding.

- [ ] **Step 2: Run test to verify it fails**
Run: `bun test packages/api/src/routers/shares.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**
Implement share creation/list/claim and grant activation behavior.

- [ ] **Step 4: Run test to verify it passes**
Run: `bun test packages/api/src/routers/shares.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

### Task 5: Approvals router

**Files:**
- Create: `packages/api/src/routers/approvals.ts`
- Modify: `packages/api/src/routers/index.ts`
- Test: `packages/api/src/routers/approvals.test.ts`

- [ ] **Step 1: Write the failing test**
Cover writer-only approval/rejection and status transitions.

- [ ] **Step 2: Run test to verify it fails**
Run: `bun test packages/api/src/routers/approvals.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**
Implement pending list and decision endpoints.

- [ ] **Step 4: Run test to verify it passes**
Run: `bun test packages/api/src/routers/approvals.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

## Chunk 3: Web Routes and Legal Pages

### Task 6: Public routes and legal templates

**Files:**
- Modify: `apps/web/src/routes/index.tsx`
- Create: `apps/web/src/routes/terms.tsx`
- Create: `apps/web/src/routes/privacy.tsx`
- Create: `apps/web/src/components/site-footer.tsx`
- Modify: `apps/web/src/components/header.tsx`

- [ ] **Step 1: Write failing route tests/checklist**
- [ ] **Step 2: Run and verify fail**
- [ ] **Step 3: Implement landing + US-general starter legal content**
- [ ] **Step 4: Verify pass**
- [ ] **Step 5: Commit**

### Task 7: Authenticated workflow routes

**Files:**
- Create: `apps/web/src/routes/documents.tsx`
- Create: `apps/web/src/routes/documents.new.tsx`
- Create: `apps/web/src/routes/shares.tsx`
- Create: `apps/web/src/routes/writer.approvals.tsx`
- Create: `apps/web/src/routes/inbox.tsx`
- Modify: `apps/web/src/components/header.tsx`

- [ ] **Step 1: Write failing route/component tests/checklist**
- [ ] **Step 2: Run and verify fail**
- [ ] **Step 3: Implement forms/lists/status transitions**
- [ ] **Step 4: Verify pass**
- [ ] **Step 5: Commit**

## Chunk 4: Env, Docs, and Verification

### Task 8: Env and project docs updates

**Files:**
- Modify: `packages/env/src/server.ts`
- Modify: `README.md`

- [ ] **Step 1: Add failing env parse tests when adding vars**
- [ ] **Step 2: Add storage mode vars and placeholders for S3**
- [ ] **Step 3: Update setup and workflow docs**
- [ ] **Step 4: Verify commands pass**
Run:
- `bun run check-types`
- `bun run db:generate`
- `bun run db:push`
- `bun test`
- [ ] **Step 5: Commit**

### Task 9: Permissions policy file validation

**Files:**
- Modify: `Agents.md` (only if needed)

- [ ] **Step 1: Confirm policy text remains accurate**
- [ ] **Step 2: Keep read-only allowed; non-read actions require approval**
- [ ] **Step 3: Commit if changed**
