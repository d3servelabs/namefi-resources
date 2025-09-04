CREATE SCHEMA "__config";
--> statement-breakpoint
CREATE TABLE "__config"."user_permissions" (
	"user_id" uuid NOT NULL,
	"permission" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_permissions_user_id_permission_pk" PRIMARY KEY("user_id","permission")
);
--> statement-breakpoint
ALTER TABLE "__config"."user_permissions" ADD CONSTRAINT "user_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_permissions_user_id_idx" ON "__config"."user_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_permissions_permission_idx" ON "__config"."user_permissions" USING btree ("permission");