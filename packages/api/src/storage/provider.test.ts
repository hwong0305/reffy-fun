import { describe, expect, it } from "bun:test";

import { createStorageProvider } from "./index";

describe("storage providers", () => {
	it("returns database provider by default", () => {
		const provider = createStorageProvider();

		expect(provider.kind).toBe("database_blob");
	});

	it("returns s3 provider when requested", () => {
		const provider = createStorageProvider({ kind: "s3" });

		expect(provider.kind).toBe("s3");
	});
});
