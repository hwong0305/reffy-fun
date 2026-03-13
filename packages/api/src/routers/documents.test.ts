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

describe("documents router", () => {
	it("createUploadTarget returns an upload contract", async () => {
		const caller = await createCaller();

		const result = await caller.documents.createUploadTarget({
			fileName: "resume.pdf",
			mimeType: "application/pdf",
			sizeBytes: 1024,
		});

		expect(result.uploadToken.length).toBeGreaterThan(0);
		expect(result.storageKey.startsWith("db/")).toBe(true);
	});

	it("createUploadTarget validates positive size", async () => {
		const caller = await createCaller();

		await expect(
			caller.documents.createUploadTarget({
				fileName: "resume.pdf",
				mimeType: "application/pdf",
				sizeBytes: 0,
			}),
		).rejects.toThrow();
	});

	it("finalizeUpload validates required numeric bounds", async () => {
		const caller = await createCaller();

		await expect(
			caller.documents.finalizeUpload({
				storageKey: "db/test-key",
				fileName: "letter.pdf",
				mimeType: "application/pdf",
				sizeBytes: 0,
				type: "recommendation",
			}),
		).rejects.toThrow();
	});
});
