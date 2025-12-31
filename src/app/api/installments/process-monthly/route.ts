import { processMonthlyInstallments } from '@/lib/installment-worker';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * API Route to Process Monthly Installments
 *
 * This endpoint processes all active installments by:
 * 1. Creating expense transactions from linked wallets
 * 2. Reducing credit card used limits
 * 3. Updating installment progress
 *
 * SECURITY: In production, you should:
 * - Add proper authentication
 * - Use cron job services (Vercel Cron, GitHub Actions, etc.)
 * - Add rate limiting
 * - Log all processing for audit
 *
 * Example cron usage with Vercel:
 * ```
 * {
 *   "crons": [{
 *     "path": "/api/installments/process-monthly",
 *     "schedule": "0 0 1 * *"
 *   }]
 * }
 * ```
 */
export async function POST(request: Request) {
  try {
    // Optional: Require authentication for manual triggers
    const session = await getServerSession(authOptions);

    // For cron jobs, you might want to use a secret token instead
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow either authenticated user OR cron secret
    if (!session && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('📅 Monthly installment processing triggered');
    console.log(`   Triggered by: ${session ? `User ${session.user?.email}` : 'Cron Job'}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);

    const result = await processMonthlyInstallments();

    return Response.json({
      success: true,
      message: `Successfully processed ${result.count} installments`,
      processed: result.count,
      timestamp: new Date().toISOString(),
      details: result.installments.map((item) => ({
        installmentId: item.installment.id,
        description: item.installment.description,
        progress: `${item.installment.currentInstallment}/${item.installment.tenor}`,
        isComplete: item.isComplete,
        transactionId: item.transaction.id,
        amount: item.transaction.amount,
      })),
    });
  } catch (error) {
    console.error('Error in monthly installment processing:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process monthly installments',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check status (for monitoring)
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return active installments count
    const prisma = await import('@/lib/prisma').then((m) => m.default);
    const activeInstallments = await prisma.installment.count({
      where: {
        currentInstallment: {
          lt: prisma.installment.fields.tenor,
        },
      },
    });

    return Response.json({
      status: 'healthy',
      activeInstallments,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
