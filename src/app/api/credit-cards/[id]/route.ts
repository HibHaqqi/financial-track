import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { deleteCreditCard, updateCreditCard } from '@/lib/data';

/**
 * PUT /api/credit-cards/[id]
 *
 * Updates a credit card's details.
 */
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { error: 'Missing credit card id' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, totalLimit, billingDate } = body;

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
    } catch (error: any) {
        console.error('Error updating credit card:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to update credit card' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/credit-cards/[id]
 *
 * Deletes a credit card. Will fail if the card has any installments.
 */
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = params;

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

        // Handle specific error messages
        if (error.message && error.message.includes('Cannot delete credit card')) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error?.message || 'Failed to delete credit card' },
            { status: 500 }
        );
    }
}
