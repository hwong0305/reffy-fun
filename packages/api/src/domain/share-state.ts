export type DocumentType = "recommendation" | "transcript" | "resume";

export type ShareStatus =
	| "pending_writer_approval"
	| "approved"
	| "rejected"
	| "claimed";

export type WriterDecision = "approved" | "rejected";

export type ShareTransitionEvent =
	| "writer_decision"
	| "recipient_claim"
	| "owner_revoke";

export function requiresWriterApproval(documentType: DocumentType) {
	return documentType === "recommendation";
}

export function getInitialShareStatus(documentType: DocumentType): ShareStatus {
	if (requiresWriterApproval(documentType)) {
		return "pending_writer_approval";
	}

	return "approved";
}

export function getShareStatusAfterClaim(
	currentStatus: ShareStatus,
): ShareStatus {
	if (currentStatus === "approved" || currentStatus === "claimed") {
		return "claimed";
	}

	return currentStatus;
}

export function getShareStatusAfterWriterDecision(
	decision: WriterDecision,
	hasRecipientUserId: boolean,
): ShareStatus {
	if (decision === "rejected") {
		return "rejected";
	}

	return hasRecipientUserId ? "claimed" : "approved";
}

export function canOwnerRevokeShare(status: ShareStatus) {
	return status !== "rejected";
}

export function getShareStatusAfterOwnerRevocation(): ShareStatus {
	return "rejected";
}

export function canWriterDecideShare(status: ShareStatus) {
	return status === "pending_writer_approval";
}

export function canRecipientClaimShare(status: ShareStatus) {
	return status === "approved" || status === "claimed";
}

export function canCreateShareForRecipient(existingStatuses: ShareStatus[]) {
	if (existingStatuses.length === 0) {
		return true;
	}

	return existingStatuses.every((status) => status === "rejected");
}

type WriterTransitionInput = {
	decision: WriterDecision;
	hasRecipientUserId: boolean;
};

export function resolveShareTransition(
	currentStatus: ShareStatus,
	event: ShareTransitionEvent,
	input?: WriterTransitionInput,
): ShareStatus | null {
	if (event === "owner_revoke") {
		return canOwnerRevokeShare(currentStatus)
			? getShareStatusAfterOwnerRevocation()
			: null;
	}

	if (event === "recipient_claim") {
		return canRecipientClaimShare(currentStatus)
			? getShareStatusAfterClaim(currentStatus)
			: null;
	}

	if (!input) {
		return null;
	}

	return canWriterDecideShare(currentStatus)
		? getShareStatusAfterWriterDecision(
				input.decision,
				input.hasRecipientUserId,
			)
		: null;
}
