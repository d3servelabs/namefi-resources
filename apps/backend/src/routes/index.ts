import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import posts from "./posts";
import users from "./users";

const app = new OpenAPIHono();

app.route("/users", users);
app.route("/posts", posts);

// OpenAPI documentation
app.doc("/doc", {
	openapi: "3.0.0",
	info: {
		version: "1.0.0",
		title: "User and Post Management API",
		description: "API for managing users and posts",
	},
	servers: [
		{
			url: "http://localhost:3000",
			description: "Development server",
		},
	],
});

app.get(
	"/swagger",
	swaggerUI({
		url: "/doc",
	}),
);

export default app;
