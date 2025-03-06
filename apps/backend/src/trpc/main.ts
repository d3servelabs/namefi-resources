import * as trpcExpress from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";
import { createContext } from "./context";
import { appRouter } from "./routers/appRouter";

async function main() {
	// express implementation
	const app = express();
	app.use(cors());
	app.use((req, _res, next) => {
		// request logger
		console.log("⬅️ ", req.method, req.path, req.body ?? req.query);

		next();
	});

	app.use(
		"/trpc",
		trpcExpress.createExpressMiddleware({
			router: appRouter,
			createContext,
		}),
	);
	app.get("/", (_req, res) => {
		res.send("hello");
	});
	app.listen(2021, () => {
		console.log("listening on port 2021");
	});
}

main();
