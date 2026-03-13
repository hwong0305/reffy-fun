import { describe, expect, it } from "bun:test";

async function createCaller() {
	process.env.DATABASE_URL ??= "file:./packages/db/local.db";
	process.env.BETTER_AUTH_SECRET ??= "12345678901234567890123456789012";
	process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
	process.env.CORS_ORIGIN ??= "http://localhost:3001";

	const { appRouter } = await import("./index");
	return appRouter.createCaller({
		session: {
			user: {
				id: "user-test-1",
				email: "user@example.com",
				name: "User Test",
			},
		},
	} as never);
}

describe("shares router", () => {
	it("createRecipientShare validates recipient email format", async () => {
		const caller = await createCaller();

		await expect(
			caller.shares.createRecipientShare({
				documentId: "doc-1",
				recipientEmail: "invalid-email",
			}),
		).rejects.toThrow();
	});

	it("claimShareByEmail validates shareId input", async () => {
		const caller = await createCaller();

		await expect(
			caller.shares.claimShareByEmail({
				shareId: "",
			}),
		).rejects.toThrow();
	});

	it("revokeShare validates shareId input", async () => {
		const caller = await createCaller();

		await expect(
			caller.shares.revokeShare({
				shareId: "",
			}),
		).rejects.toThrow();
	});
});
