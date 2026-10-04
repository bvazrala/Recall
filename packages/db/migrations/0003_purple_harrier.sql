CREATE TABLE "topic_confidence_days" (
	"topic_id" uuid NOT NULL,
	"date" date NOT NULL,
	"score" integer NOT NULL,
	"overridden" boolean DEFAULT false NOT NULL,
	CONSTRAINT "topic_confidence_days_topic_id_date_pk" PRIMARY KEY("topic_id","date")
);
--> statement-breakpoint
DROP INDEX "topics_student_id_confidence_score_index";--> statement-breakpoint
ALTER TABLE "topic_confidence_days" ADD CONSTRAINT "topic_confidence_days_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" DROP COLUMN "confidence_score";--> statement-breakpoint
ALTER TABLE "topics" DROP COLUMN "confidence_level";