import { redirect } from "@tanstack/react-router";

import { authClient } from "./auth-client";

export async function requireAuth() {
	const session = await authClient.getSession();

	if (!session.data) {
		redirect({
			to: "/login",
			throw: true,
		});
	}

	return { session };
}
