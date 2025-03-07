import { initTRPC } from "@trpc/server";
import type * as trpcExpress from "@trpc/server/adapters/express";
import superjson from "superjson";

export const createContext = ({
	req,
	res,
}: trpcExpress.CreateExpressContextOptions) => {
	const getUser = () => {
		if (req.headers.authorization !== "secret") {
			return null;
		}
		return {
			name: "alex",
		};
	};

	return {
		req,
		res,
		user: getUser(),
	};
};
export type TrpcContext = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<TrpcContext>().create({
	transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
