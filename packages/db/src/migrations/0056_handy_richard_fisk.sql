CREATE TABLE "poweredby_namefi_domains" (
	"normalized_domain_name" text NOT NULL,
	"additional_allowed_hostnames" text[] DEFAULT '{}',
	"additional_reserved_names" text[] DEFAULT '{}',
	"duration_constraints" jsonb NOT NULL,
	"cost_per_year_in_usd_cents" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"owner_id" uuid,
	"enabled" boolean DEFAULT true NOT NULL,
	"start_rollout_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "poweredby_namefi_domains_normalized_domain_name_pk" PRIMARY KEY("normalized_domain_name"),
	CONSTRAINT "pb_namefi_cost_nonnegative" CHECK ("poweredby_namefi_domains"."cost_per_year_in_usd_cents" >= 0),
	CONSTRAINT "pb_namefi_duration_valid" CHECK (((("poweredby_namefi_domains"."duration_constraints") ->> 'minDurationInYears')::int > 0)  
            AND ((("poweredby_namefi_domains"."duration_constraints") ->> 'maxDurationInYears')::int >= ((("poweredby_namefi_domains"."duration_constraints") ->> 'minDurationInYears')::int)))
);
--> statement-breakpoint
ALTER TABLE "poweredby_namefi_domains" ADD CONSTRAINT "poweredby_namefi_domains_owner_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "poweredby_namefi_domains_enabled_idx" ON "poweredby_namefi_domains" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "poweredby_namefi_domains_start_rollout_at_idx" ON "poweredby_namefi_domains" USING btree ("start_rollout_at");--> statement-breakpoint
CREATE INDEX "poweredby_namefi_domains_allowed_hostnames_gin" ON "poweredby_namefi_domains" USING gin ("additional_allowed_hostnames");