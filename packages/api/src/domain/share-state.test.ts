import { describe, expect, it } from "bun:test";

import {
	canCreateShareForRecipient,
	canOwnerRevokeShare,
	canRecipientClaimShare,
	canWriterDecideShare,
	getInitialShareStatus,
	getShareStatusAfterClaim,
	getShareStatusAfterOwnerRevocation,
	getShareStatusAfterWriterDecision,
	requiresWriterApproval,
	resolveShareTransition,
} from "./share-state";

describe("share-state", () => {
	it("requires writer approval only for recommendation letters", () => {
		expect(requiresWriterApproval("recommendation")).toBe(true);
		expect(requiresWriterApproval("transcript")).toBe(false);
		expect(requiresWriterApproval("resume")).toBe(false);
	});

	it("computes initial share status by document type", () => {
		expect(getInitialShareStatus("recommendation")).toBe(
			"pending_writer_approval",
		);
		expect(getInitialShareStatus("transcript")).toBe("approved");
		expect(getInitialShareStatus("resume")).toBe("approved");
	});

	it("sets claimed immediately for approved shares on claim", () => {
		expect(getShareStatusAfterClaim("approved")).toBe("claimed");
		expect(getShareStatusAfterClaim("claimed")).toBe("claimed");
		expect(getShareStatusAfterClaim("pending_writer_approval")).toBe(
			"pending_writer_approval",
		);
		expect(getShareStatusAfterClaim("rejected")).toBe("rejected");
	});

	it("advances status after writer decision", () => {
		expect(getShareStatusAfterWriterDecision("approved", false)).toBe(
			"approved",
		);
		expect(getShareStatusAfterWriterDecision("approved", true)).toBe("claimed");
		expect(getShareStatusAfterWriterDecision("rejected", false)).toBe(
			"rejected",
		);
		expect(getShareStatusAfterWriterDecision("rejected", true)).toBe(
			"rejected",
		);
	});

	it("allows owner revocation unless already rejected", () => {
		expect(canOwnerRevokeShare("pending_writer_approval")).toBe(true);
		expect(canOwnerRevokeShare("approved")).toBe(true);
		expect(canOwnerRevokeShare("claimed")).toBe(true);
		expect(canOwnerRevokeShare("rejected")).toBe(false);
	});

	it("maps owner revocation to rejected state", () => {
		expect(getShareStatusAfterOwnerRevocation()).toBe("rejected");
	});

	it("allows writer decision only for pending shares", () => {
		expect(canWriterDecideShare("pending_writer_approval")).toBe(true);
		expect(canWriterDecideShare("approved")).toBe(false);
		expect(canWriterDecideShare("claimed")).toBe(false);
		expect(canWriterDecideShare("rejected")).toBe(false);
	});

	it("allows recipient claim only for approved or already claimed shares", () => {
		expect(canRecipientClaimShare("approved")).toBe(true);
		expect(canRecipientClaimShare("claimed")).toBe(true);
		expect(canRecipientClaimShare("pending_writer_approval")).toBe(false);
		expect(canRecipientClaimShare("rejected")).toBe(false);
	});

	it("allows new share only when previous shares are all rejected", () => {
		expect(canCreateShareForRecipient([])).toBe(true);
		expect(canCreateShareForRecipient(["rejected"])).toBe(true);
		expect(canCreateShareForRecipient(["rejected", "rejected"])).toBe(true);

		expect(canCreateShareForRecipient(["pending_writer_approval"])).toBe(false);
		expect(canCreateShareForRecipient(["approved"])).toBe(false);
		expect(canCreateShareForRecipient(["claimed"])).toBe(false);
		expect(canCreateShareForRecipient(["rejected", "approved"])).toBe(false);
	});

	it("resolves valid lifecycle transitions", () => {
		expect(
			resolveShareTransition("pending_writer_approval", "writer_decision", {
				decision: "approved",
				hasRecipientUserId: false,
			}),
		).toBe("approved");

		expect(resolveShareTransition("approved", "recipient_claim")).toBe(
			"claimed",
		);

		expect(resolveShareTransition("claimed", "owner_revoke")).toBe("rejected");
	});

	it("blocks invalid lifecycle transitions", () => {
		expect(resolveShareTransition("rejected", "recipient_claim")).toBeNull();

		expect(
			resolveShareTransition("approved", "writer_decision", {
				decision: "approved",
				hasRecipientUserId: false,
			}),
		).toBeNull();

		expect(resolveShareTransition("rejected", "owner_revoke")).toBeNull();
	});
});
