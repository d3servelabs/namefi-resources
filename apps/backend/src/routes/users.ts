import { db } from "@/lib/db/client";
import {
	userInsertSchema,
	userSelectSchema,
	usersTable,
} from "@/lib/db/schema";
import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

const users = new OpenAPIHono();

// Schemas
const UserSchema = userSelectSchema
	.transform((data) => ({
		id: data.id.toString(),
		name: data.name,
		email: data.email,
		age: data.age,
	}))
	.openapi("User");

const CreateUserSchema = userInsertSchema
	.pick({ name: true, email: true, age: true })
	.extend({
		password: z.string().min(6),
	})
	.openapi("CreateUser");

const UserParamsSchema = z.object({
	id: z
		.string()
		.min(1)
		.openapi({
			param: {
				name: "id",
				in: "path",
			},
			example: "123",
		}),
});

// Routes
const createUserRoute = createRoute({
	method: "post",
	path: "/",
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateUserSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: UserSchema,
				},
			},
			description: "User created successfully",
		},
		400: {
			description: "Invalid input",
			content: {
				"application/json": {
					schema: z.object({
						error: z.string(),
					}),
				},
			},
		},
	},
});

const getUserRoute = createRoute({
	method: "get",
	path: "/{id}",
	request: {
		params: UserParamsSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: UserSchema,
				},
			},
			description: "Retrieve the user",
		},
		404: {
			description: "User not found",
			content: {
				"application/json": {
					schema: z.object({
						error: z.string(),
					}),
				},
			},
		},
	},
});

// Route handlers
users.openapi(createUserRoute, async (c) => {
	const data = c.req.valid("json");
	const [user] = await db
		.insert(usersTable)
		.values({
			name: data.name,
			email: data.email,
			age: data.age,
		})
		.returning();

	return c.json(
		{
			id: user.id.toString(),
			name: user.name,
			email: user.email,
			age: user.age,
		},
		201,
	);
});

users.openapi(getUserRoute, async (c) => {
	const { id } = c.req.valid("param");
	const [user] = await db
		.select()
		.from(usersTable)
		.where(eq(usersTable.id, Number.parseInt(id)));

	if (!user) {
		return c.json({ error: "User not found" }, 404);
	}

	return c.json(
		{
			id: user.id.toString(),
			name: user.name,
			email: user.email,
			age: user.age,
		},
		200,
	);
});

export default users;
