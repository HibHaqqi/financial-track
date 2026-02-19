import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../api/auth/[...nextauth]/route';
import { getCreditCardById, getCreditCardMonthlyBilling } from '@/lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creditCard = await getCreditCardById(params.id, session.user.id);
    if (!creditCard) {
      return NextResponse.json({ error: 'Credit card not found' }, { status: 404 });
    }

    // Get year and month from query params, default to current period
    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    const now = new Date();
    const year = yearParam ? parseInt(yearParam) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1;

    const billing = await getCreditCardMonthlyBilling(params.id, year, month);

    return NextResponse.json(billing);
  } catch (error) {
    console.error('Error fetching monthly billing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly billing' },
      { status: 500 }
    );
  }
}
