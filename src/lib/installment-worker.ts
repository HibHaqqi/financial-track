import prisma from './prisma';

/**
 * Monthly Installment Worker
 *
 * This function should be called once per month (e.g., via cron job)
 * to automatically process installment payments.
 *
 * Logic:
 * 1. Find all active installments
 * 2. For each installment:
 *    - Create an expense transaction from linkedWallet
 *    - Reduce credit card usedLimit by monthlyPayment
 *    - Increment currentInstallment counter
 *    - If currentInstallment == tenor, mark as complete
 */
export async function processMonthlyInstallments() {
  console.log('🔄 Starting monthly installment processing...');

  const result = await prisma.$transaction(async (tx) => {
    // Get all active installments
    const activeInstallments = await tx.installment.findMany({
      where: {
        currentInstallment: {
          lt: prisma.installment.fields.tenor,
        },
        linkedWalletId: {
          not: null,
        },
      },
      include: {
        creditCard: true,
        category: true,
        linkedWallet: true,
      },
    });

    console.log(`📊 Found ${activeInstallments.length} active installments`);

    const processedInstallments = [];

    for (const installment of activeInstallments) {
      // Validate linked wallet exists
      if (!installment.linkedWallet) {
        console.error(`❌ Installment ${installment.id} has no linked wallet, skipping`);
        continue;
      }

      // Create expense transaction from linked wallet
      const transaction = await tx.transaction.create({
        data: {
          amount: installment.monthlyPayment,
          description: `Installment payment: ${installment.description} (${installment.currentInstallment + 1}/${installment.tenor})`,
          type: 'expense',
          date: new Date(),
          walletId: installment.linkedWalletId,
          categoryId: installment.categoryId,
          installmentId: installment.id,
        },
      });

      // Reduce credit card used limit (payment "buys back" some limit)
      await tx.creditCard.update({
        where: { id: installment.creditCardId },
        data: {
          usedLimit: {
            decrement: installment.monthlyPayment,
          },
        },
      });

      // Increment installment progress
      const newInstallmentNumber = installment.currentInstallment + 1;
      const isComplete = newInstallmentNumber >= installment.tenor;

      const updatedInstallment = await tx.installment.update({
        where: { id: installment.id },
        data: {
          currentInstallment: {
            increment: 1,
          },
        },
      });

      console.log(`✅ Processed installment: ${installment.description}`);
      console.log(`   Payment: Rp${installment.monthlyPayment.toLocaleString()} from ${installment.linkedWallet.name}`);
      console.log(`   Progress: ${newInstallmentNumber}/${installment.tenor} ${isComplete ? '(COMPLETED)' : ''}`);
      console.log(`   Transaction created: ${transaction.id}`);

      processedInstallments.push({
        installment: updatedInstallment,
        transaction,
        isComplete,
      });
    }

    return {
      count: processedInstallments.length,
      installments: processedInstallments,
    };
  });

  console.log(`✅ Monthly installment processing complete: ${result.count} installments processed`);

  return result;
}

/**
 * API Route Handler for manual trigger or webhooks
 *
 * Usage:
 * - Call this endpoint via cron job monthly
 * - Add authentication middleware to secure this endpoint
 * - Or use with Vercel Cron Jobs or similar
 */
export async function POST() {
  try {
    const result = await processMonthlyInstallments();

    return Response.json({
      success: true,
      processed: result.count,
      details: result.installments,
    });
  } catch (error) {
    console.error('Error processing monthly installments:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to process monthly installments',
      },
      { status: 500 }
    );
  }
}
