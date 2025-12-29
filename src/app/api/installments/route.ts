import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  getInstallments,
  getActiveInstallments,
  getInstallmentById,
  addInstallment,
  updateInstallmentProgress,
  deleteInstallment,
  calculateMonthlyInstallmentBurden,
} from '@/lib/data';

// GET /api/installments - List installments for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') === 'true';
    const id = searchParams.get('id');

    // If id is provided, get single installment
    if (id) {
      const installment = await getInstallmentById(id);
      if (!installment) {
        return NextResponse.json(
          { error: 'Installment not found' },
          { status: 404 }
        );
      }

      // Verify ownership
      if (installment.creditCard.userId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      return NextResponse.json(installment, { status: 200 });
    }

    // Get list of installments
    const installments = activeOnly
      ? await getActiveInstallments(session.user.id)
      : await getInstallments(session.user.id);

    return NextResponse.json(installments, { status: 200 });
  } catch (error) {
    console.error('Error fetching installments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch installments' },
      { status: 500 }
    );
  }
}

// POST /api/installments - Create a new installment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      description,
      totalAmount,
      monthlyPayment,
      tenor,
      startDate,
      creditCardId,
      categoryId,
      transactionId,
    } = body;

    // Validation
    if (!description || !totalAmount || !monthlyPayment || !tenor || !startDate || !creditCardId || !categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'totalAmount must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof monthlyPayment !== 'number' || monthlyPayment <= 0) {
      return NextResponse.json(
        { error: 'monthlyPayment must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof tenor !== 'number' || tenor <= 0 || tenor > 60) {
      return NextResponse.json(
        { error: 'tenor must be between 1 and 60' },
        { status: 400 }
      );
    }

    const installment = await addInstallment({
      description,
      totalAmount,
      monthlyPayment,
      tenor,
      startDate: new Date(startDate),
      creditCardId,
      categoryId,
      transactionId,
    });

    return NextResponse.json(installment, { status: 201 });
  } catch (error) {
    console.error('Error creating installment:', error);
    return NextResponse.json(
      { error: 'Failed to create installment' },
      { status: 500 }
    );
  }
}

// PATCH /api/installments - Update installment progress
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing installment id' },
        { status: 400 }
      );
    }

    if (action === 'increment') {
      await updateInstallmentProgress(id);
      const installment = await getInstallmentById(id);
      return NextResponse.json(installment, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating installment:', error);
    return NextResponse.json(
      { error: 'Failed to update installment' },
      { status: 500 }
    );
  }
}

// DELETE /api/installments - Delete an installment
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
        { error: 'Missing installment id' },
        { status: 400 }
      );
    }

    // Verify ownership before deleting
    const installment = await getInstallmentById(id);
    if (!installment) {
      return NextResponse.json(
        { error: 'Installment not found' },
        { status: 404 }
      );
    }

    if (installment.creditCard.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await deleteInstallment(id);

    return NextResponse.json(
      { message: 'Installment deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting installment:', error);
    return NextResponse.json(
      { error: 'Failed to delete installment' },
      { status: 500 }
    );
  }
}
