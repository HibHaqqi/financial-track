import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getWallets } from '@/lib/data';

/**
 * GET /api/wallets
 *
 * Fetches all wallets for the authenticated user with their transactions
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const wallets = await getWallets(session.user.id);

    return NextResponse.json(wallets, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching wallets:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch wallets' },
      { status: 500 }
    );
  }
}
