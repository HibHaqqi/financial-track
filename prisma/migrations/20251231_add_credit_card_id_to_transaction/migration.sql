-- AddCreditCardIdToTransaction
-- This migration adds the missing creditCardId column to Transaction table
-- and adds the necessary foreign key constraint

-- Add creditCardId column to Transaction table (nullable, optional)
ALTER TABLE "Transaction" ADD COLUMN "creditCardId" TEXT;

-- Create index for creditCardId to improve query performance
CREATE INDEX "Transaction_creditCardId_idx" ON "Transaction"("creditCardId");

-- Add foreign key constraint for Transaction.creditCardId (ON DELETE SET NULL - safe)
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
