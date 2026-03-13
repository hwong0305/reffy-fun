import { describe, expect, it } from "bun:test";

import {
	CURRENT_PRIVACY_VERSION,
	CURRENT_TERMS_VERSION,
	isLegalAcceptanceUpToDate,
} from "./legal";

describe("legal versions", () => {
	it("acceptance is up-to-date when versions match", () => {
		expect(
			isLegalAcceptanceUpToDate({
				termsVersion: CURRENT_TERMS_VERSION,
				privacyVersion: CURRENT_PRIVACY_VERSION,
			}),
		).toBe(true);
	});

	it("acceptance is stale when versions differ", () => {
		expect(
			isLegalAcceptanceUpToDate({
				termsVersion: "2026-01-01",
				privacyVersion: CURRENT_PRIVACY_VERSION,
			}),
		).toBe(false);
	});
});
