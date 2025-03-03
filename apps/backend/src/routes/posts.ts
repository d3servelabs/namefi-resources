import { db } from "@/lib/db/client";
import {
	postInsertSchema,
	postSelectSchema,
	postsTable,
} from "@/lib/db/schema";
import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { createRoute } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";

const posts = new OpenAPIHono();

// Schemas
const PostSchema = postSelectSchema
	.transform((data) => ({
		id: data.id.toString(),
		title: data.title,
		content: data.content,
		userId: data.userId.toString(),
		createdAt: data.createdAt.toISOString(),
	}))
	.openapi("Post");

const CreatePostSchema = postInsertSchema
	.pick({ title: true, content: true, userId: true })
	.transform((data) => ({
		...data,
		userId: data.userId.toString(),
	}))
	.openapi("CreatePost");

const PostParamsSchema = z.object({
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
const createPostRoute = createRoute({
	method: "post",
	path: "/",
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreatePostSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: PostSchema,
				},
			},
			description: "Post created successfully",
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

const getPostRoute = createRoute({
	method: "get",
	path: "/{id}",
	request: {
		params: PostParamsSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: PostSchema,
				},
			},
			description: "Retrieve the post",
		},
		404: {
			description: "Post not found",
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
posts.openapi(createPostRoute, async (c) => {
	const data = c.req.valid("json");
	const [post] = await db
		.insert(postsTable)
		.values({
			title: data.title,
			content: data.content,
			userId: Number.parseInt(data.userId),
		})
		.returning();

	return c.json(
		{
			id: post.id.toString(),
			title: post.title,
			content: post.content,
			userId: post.userId.toString(),
			createdAt: post.createdAt.toISOString(),
		},
		201,
	);
});

posts.openapi(getPostRoute, async (c) => {
	const { id } = c.req.valid("param");
	const [post] = await db
		.select()
		.from(postsTable)
		.where(eq(postsTable.id, Number.parseInt(id)));

	if (!post) {
		return c.json({ error: "Post not found" }, 404);
	}

	return c.json(
		{
			id: post.id.toString(),
			title: post.title,
			content: post.content,
			userId: post.userId.toString(),
			createdAt: post.createdAt.toISOString(),
		},
		200,
	);
});

export default posts;
