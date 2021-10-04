import {MigrationInterface, QueryRunner} from "typeorm";

export class addDirectlyPublishedEventsCountToSubscriber1633174750708 implements MigrationInterface {
    name = 'addDirectlyPublishedEventsCountToSubscriber1633174750708'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."subscriber" ADD "directlyPublishedEventsCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "public"."topic" ALTER COLUMN "publishedEventsCount" SET DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."topic" ALTER COLUMN "publishedEventsCount" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "public"."subscriber" DROP COLUMN "directlyPublishedEventsCount"`);
    }

}
