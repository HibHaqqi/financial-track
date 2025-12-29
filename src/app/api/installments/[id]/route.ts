import { deleteInstallment as dbDeleteInstallment } from '@/lib/data';
import { NextResponse } from 'next/server';

/**
 * DELETE /api/installments/[id]
 *
 * Deletes an installment and all related transactions.
 * Also restores the credit card used limit.
 */
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Installment ID is required' },
                { status: 400 }
            );
        }

        await dbDeleteInstallment(id);

        return NextResponse.json({
            success: true,
            message: 'Installment deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting installment:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete installment',
            },
            { status: 500 }
        );
    }
}
