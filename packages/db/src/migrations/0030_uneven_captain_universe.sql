CREATE TABLE "user_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" text,
	"last_name" text,
	"organization_name" text,
	"phone_number" text,
	"phone_number_verified" boolean,
	"email" text,
	"email_verified" boolean,
	"fax" text,
	"address_lines" text,
	"city" text,
	"contact_type" text,
	"country_code" text,
	"state" text,
	"zip_code" text,
	"extra_params" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_contacts" ADD CONSTRAINT "user_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;