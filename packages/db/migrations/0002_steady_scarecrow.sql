CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"confidence_score" integer DEFAULT 0 NOT NULL,
	"confidence_level" text DEFAULT 'red' NOT NULL,
	"last_studied_at" timestamp with time zone,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topics_studentId_name_unique" UNIQUE("student_id","name")
);
--> statement-breakpoint
CREATE TABLE "study_day_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"study_day_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"score_before" integer NOT NULL,
	"level_before" text NOT NULL,
	"score_after" integer,
	"level_after" text,
	"overridden" boolean DEFAULT false NOT NULL,
	CONSTRAINT "study_day_topics_studyDayId_topicId_unique" UNIQUE("study_day_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "study_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "study_days_studentId_dayNumber_unique" UNIQUE("student_id","day_number")
);
--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "passage_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "quote" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "current_day" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "topic_id" uuid;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "study_day_id" uuid;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_day_topics" ADD CONSTRAINT "study_day_topics_study_day_id_study_days_id_fk" FOREIGN KEY ("study_day_id") REFERENCES "public"."study_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_day_topics" ADD CONSTRAINT "study_day_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_days" ADD CONSTRAINT "study_days_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "topics_student_id_confidence_score_index" ON "topics" USING btree ("student_id","confidence_score");--> statement-breakpoint
CREATE INDEX "study_day_topics_topic_id_index" ON "study_day_topics" USING btree ("topic_id");--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_study_day_id_study_days_id_fk" FOREIGN KEY ("study_day_id") REFERENCES "public"."study_days"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cards_topic_id_index" ON "cards" USING btree ("topic_id");