import { protectedProcedure, publicProcedure, router } from "../index";
import { approvalsRouter } from "./approvals";
import { documentsRouter } from "./documents";
import { legalRouter } from "./legal";
import { sharesRouter } from "./shares";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	documents: documentsRouter,
	shares: sharesRouter,
	approvals: approvalsRouter,
	legal: legalRouter,
});
export type AppRouter = typeof appRouter;
