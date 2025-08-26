-- DropForeignKey
ALTER TABLE "public"."comments" DROP CONSTRAINT "comments_answer_id_fkey";

-- AlterTable
ALTER TABLE "public"."comments" ADD COLUMN     "question_id" TEXT,
ALTER COLUMN "answer_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "public"."answers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
