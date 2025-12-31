/**
 * Utility script to recalculate credit card used limits from transactions
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/recalculate-credit-limits.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function recalculateCreditLimits() {
  console.log('🔄 Recalculating credit card limits...\n');

  const creditCards = await prisma.creditCard.findMany();

  for (const card of creditCards) {
    // Calculate total expenses (purchases) for this card
    const transactions = await prisma.transaction.findMany({
      where: {
        creditCardId: card.id,
        type: 'expense',
      },
    });

    const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Detect payment transactions (reduce debt)
    const paymentTransactions = transactions.filter(t =>
      /credit\s+card\s+payment|bayar\s+kartu\s+kredit|pembayaran\s+kartu\s+kredit/i.test(t.description)
    );

    const totalPayments = paymentTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate correct used limit
    const correctUsedLimit = Math.max(0, totalExpenses - totalPayments);

    console.log(`💳 ${card.name}`);
    console.log(`   Total Purchases: Rp${totalExpenses.toLocaleString('id-ID')}`);
    console.log(`   Total Payments: Rp${totalPayments.toLocaleString('id-ID')}`);
    console.log(`   Current Used Limit: Rp${card.usedLimit.toLocaleString('id-ID')}`);
    console.log(`   Correct Used Limit: Rp${correctUsedLimit.toLocaleString('id-ID')}`);
    console.log(`   Available: Rp${(card.totalLimit - correctUsedLimit).toLocaleString('id-ID')}`);

    // Update if different
    if (card.usedLimit !== correctUsedLimit) {
      await prisma.creditCard.update({
        where: { id: card.id },
        data: { usedLimit: correctUsedLimit },
      });
      console.log(`   ✅ Updated!\n`);
    } else {
      console.log(`   ✅ Already correct\n`);
    }
  }

  console.log('✨ Recalculation complete!');
}

recalculateCreditLimits()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('❌ Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
