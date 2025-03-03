import { serve } from "@hono/node-server";
import { config } from "./lib/config";
import routes from "./routes";

const app = routes;

serve(
	{
		fetch: app.fetch,
		port: config.PORT,
	},
	(info) => {
		console.log(`Server is running on port ${info.port}`);
	},
);
