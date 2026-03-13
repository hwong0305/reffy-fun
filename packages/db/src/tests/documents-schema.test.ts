import { describe, expect, it } from "bun:test";

import {
	auditEvent,
	document,
	documentAccessGrant,
	legalAcceptance,
	recipientShare,
	recommendationRequest,
	writerApproval,
} from "../schema/documents";

function getDrizzleTableName(table: unknown) {
	return (table as Record<symbol, unknown>)[Symbol.for("drizzle:Name")];
}

describe("documents schema", () => {
	it("defines required tables", () => {
		expect(document).toBeDefined();
		expect(recommendationRequest).toBeDefined();
		expect(recipientShare).toBeDefined();
		expect(writerApproval).toBeDefined();
		expect(documentAccessGrant).toBeDefined();
		expect(auditEvent).toBeDefined();
		expect(legalAcceptance).toBeDefined();
	});

	it("uses the expected table names", () => {
		expect(getDrizzleTableName(document)).toBe("document");
		expect(getDrizzleTableName(recommendationRequest)).toBe(
			"recommendation_request",
		);
		expect(getDrizzleTableName(recipientShare)).toBe("recipient_share");
		expect(getDrizzleTableName(writerApproval)).toBe("writer_approval");
		expect(getDrizzleTableName(documentAccessGrant)).toBe(
			"document_access_grant",
		);
		expect(getDrizzleTableName(auditEvent)).toBe("audit_event");
		expect(getDrizzleTableName(legalAcceptance)).toBe("legal_acceptance");
	});
});
