import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  getCreditCards,
  addCreditCard,
  updateCreditCard,
  deleteCreditCard,
} from '@/lib/data';

// GET /api/credit-cards - List all credit cards for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creditCards = await getCreditCards(session.user.id);
    return NextResponse.json(creditCards, { status: 200 });
  } catch (error) {
    console.error('Error fetching credit cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit cards' },
      { status: 500 }
    );
  }
}

// POST /api/credit-cards - Create a new credit card
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, totalLimit, billingDate } = body;

    // Validation
    if (!name || !totalLimit || !billingDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, totalLimit, billingDate' },
        { status: 400 }
      );
    }

    if (typeof totalLimit !== 'number' || totalLimit <= 0) {
      return NextResponse.json(
        { error: 'totalLimit must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof billingDate !== 'number' || billingDate < 1 || billingDate > 31) {
      return NextResponse.json(
        { error: 'billingDate must be between 1 and 31' },
        { status: 400 }
      );
    }

    const creditCard = await addCreditCard({
      name,
      totalLimit,
      billingDate,
      userId: session.user.id,
    });

    return NextResponse.json(creditCard, { status: 201 });
  } catch (error) {
    console.error('Error creating credit card:', error);
    return NextResponse.json(
      { error: 'Failed to create credit card' },
      { status: 500 }
    );
  }
}

// PUT /api/credit-cards - Update a credit card
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, totalLimit, billingDate } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing credit card id' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (totalLimit !== undefined) {
      if (typeof totalLimit !== 'number' || totalLimit <= 0) {
        return NextResponse.json(
          { error: 'totalLimit must be a positive number' },
          { status: 400 }
        );
      }
      updates.totalLimit = totalLimit;
    }
    if (billingDate !== undefined) {
      if (typeof billingDate !== 'number' || billingDate < 1 || billingDate > 31) {
        return NextResponse.json(
          { error: 'billingDate must be between 1 and 31' },
          { status: 400 }
        );
      }
      updates.billingDate = billingDate;
    }

    const creditCard = await updateCreditCard(id, session.user.id, updates);

    return NextResponse.json(creditCard, { status: 200 });
  } catch (error) {
    console.error('Error updating credit card:', error);
    return NextResponse.json(
      { error: 'Failed to update credit card' },
      { status: 500 }
    );
  }
}

// DELETE /api/credit-cards - Delete a credit card
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing credit card id' },
        { status: 400 }
      );
    }

    await deleteCreditCard(id, session.user.id);

    return NextResponse.json(
      { message: 'Credit card deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting credit card:', error);
    if (error.message === 'Cannot delete credit card with active installments') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete credit card' },
      { status: 500 }
    );
  }
}
