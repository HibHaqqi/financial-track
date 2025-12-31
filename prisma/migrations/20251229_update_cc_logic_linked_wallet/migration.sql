-- Drop the unique constraint from installmentId in Transaction table
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_installmentId_key";

-- Add linkedWalletId to Installment table as optional
ALTER TABLE "Installment" ADD COLUMN "linkedWalletId" TEXT;

-- Create foreign key constraint for linkedWalletId
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_linkedWalletId_fkey" FOREIGN KEY ("linkedWalletId") REFERENCES "Wallet"(id) ON DELETE CASCADE ON UPDATE CASCADE;
