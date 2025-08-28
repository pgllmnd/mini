-- Check if table already exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'password_resets') THEN
        -- CreateTable
        CREATE TABLE "password_resets" (
            "id" TEXT NOT NULL,
            "token" TEXT NOT NULL,
            "user_id" TEXT NOT NULL,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "expires_at" TIMESTAMP(3) NOT NULL,
            "used" BOOLEAN NOT NULL DEFAULT false,
            CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
        );

        -- CreateIndex
        CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

        -- AddForeignKey
        ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

        RAISE NOTICE 'Created password_resets table and related constraints';
    ELSE
        RAISE NOTICE 'password_resets table already exists, skipping creation';
    END IF;
END $$;
