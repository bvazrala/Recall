CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" text,
	"phone" text,
	"photon_user_id" text,
	"photon_number" text,
	"status" text DEFAULT 'active' NOT NULL,
	"timezone" text DEFAULT 'America/Detroit' NOT NULL,
	"guest_expires_at" timestamp with time zone,
	"age_confirmed_at" timestamp with time zone,
	"is_demo" boolean DEFAULT false NOT NULL,
	"clock_offset_ms" bigint DEFAULT 0 NOT NULL,
	"last_inbound_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_authUserId_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "students_phone_unique" UNIQUE("phone")
);
