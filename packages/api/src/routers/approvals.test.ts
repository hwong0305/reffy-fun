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
				id: "writer-test-1",
				email: "writer@example.com",
				name: "Writer Test",
			},
		},
	} as never);
}

describe("approvals router", () => {
	it("decideShareApproval validates decision enum", async () => {
		const caller = await createCaller();

		await expect(
			caller.approvals.decideShareApproval({
				shareId: "share-1",
				decision: "invalid" as "approved",
			}),
		).rejects.toThrow();
	});

	it("decideShareApproval validates shareId", async () => {
		const caller = await createCaller();

		await expect(
			caller.approvals.decideShareApproval({
				shareId: "",
				decision: "approved",
			}),
		).rejects.toThrow();
	});
});
