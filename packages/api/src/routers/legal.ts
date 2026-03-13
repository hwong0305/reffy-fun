import { auditEvent, db, legalAcceptance } from "@reffy-fun/db";
import { protectedProcedure, publicProcedure, router } from "../index";
import {
	CURRENT_PRIVACY_VERSION,
	CURRENT_TERMS_VERSION,
	isLegalAcceptanceUpToDate,
} from "../legal";

export const legalRouter = router({
	getCurrentVersions: publicProcedure.query(() => {
		return {
			termsVersion: CURRENT_TERMS_VERSION,
			privacyVersion: CURRENT_PRIVACY_VERSION,
		};
	}),
	getAcceptanceStatus: protectedProcedure.query(async ({ ctx }) => {
		const acceptance = await db.query.legalAcceptance.findFirst({
			where: (table, { eq }) => eq(table.userId, ctx.session.user.id),
		});

		if (!acceptance) {
			return {
				accepted: false,
				upToDate: false,
				termsVersion: CURRENT_TERMS_VERSION,
				privacyVersion: CURRENT_PRIVACY_VERSION,
			};
		}

		return {
			accepted: true,
			upToDate: isLegalAcceptanceUpToDate(acceptance),
			termsVersion: acceptance.termsVersion,
			privacyVersion: acceptance.privacyVersion,
			acceptedAt: acceptance.acceptedAt,
		};
	}),
	acceptCurrentVersions: protectedProcedure.mutation(async ({ ctx }) => {
		const now = new Date();

		await db
			.insert(legalAcceptance)
			.values({
				id: crypto.randomUUID(),
				userId: ctx.session.user.id,
				termsVersion: CURRENT_TERMS_VERSION,
				privacyVersion: CURRENT_PRIVACY_VERSION,
				acceptedAt: now,
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: legalAcceptance.userId,
				set: {
					termsVersion: CURRENT_TERMS_VERSION,
					privacyVersion: CURRENT_PRIVACY_VERSION,
					acceptedAt: now,
					updatedAt: now,
				},
			});

		await db.insert(auditEvent).values({
			id: crypto.randomUUID(),
			actorUserId: ctx.session.user.id,
			entityType: "user",
			entityId: ctx.session.user.id,
			eventType: "legal.accepted_current_versions",
			payloadJson: JSON.stringify({
				termsVersion: CURRENT_TERMS_VERSION,
				privacyVersion: CURRENT_PRIVACY_VERSION,
			}),
			createdAt: now,
		});

		return {
			accepted: true,
			termsVersion: CURRENT_TERMS_VERSION,
			privacyVersion: CURRENT_PRIVACY_VERSION,
		};
	}),
});
