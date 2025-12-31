'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2 } from 'lucide-react';

interface CreditCardData {
    id: string;
    name: string;
    totalLimit: number;
    usedLimit: number;
    billingDate: number;
    userId: string;
}

interface CreditCardFormProps {
    card: CreditCardData | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreditCardForm({ card, onClose, onSuccess }: CreditCardFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: card?.name || '',
        totalLimit: card?.totalLimit || 0,
        billingDate: card?.billingDate || 1,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = card
                ? `/api/credit-cards/${card.id}`
                : '/api/credit-cards';

            const method = card ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to save credit card');
            }

            toast({
                title: 'Success',
                description: `Credit card ${card ? 'updated' : 'created'} successfully`,
            });

            router.refresh();
            onSuccess();
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'An error occurred',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!card) return;
        if (!confirm('Are you sure you want to delete this credit card?')) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/credit-cards/${card.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete credit card');
            }

            toast({
                title: 'Success',
                description: 'Credit card deleted successfully',
            });

            router.refresh();
            onSuccess();
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'An error occurred',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {card ? 'Edit Credit Card' : 'Add Credit Card'}
                    </DialogTitle>
                    <DialogDescription>
                        {card
                            ? 'Update your credit card information'
                            : 'Add a new credit card to track spending and installments'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Card Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g., BCA Platinum"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="totalLimit">Total Limit</Label>
                            <Input
                                id="totalLimit"
                                type="number"
                                placeholder="e.g., 50000000"
                                value={formData.totalLimit || ''}
                                onChange={(e) => setFormData({ ...formData, totalLimit: parseFloat(e.target.value) || 0 })}
                                required
                                min="0"
                                step="1000"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="billingDate">Billing Date (1-31)</Label>
                            <Input
                                id="billingDate"
                                type="number"
                                placeholder="e.g., 25"
                                value={formData.billingDate || ''}
                                onChange={(e) => setFormData({ ...formData, billingDate: parseInt(e.target.value) || 1 })}
                                required
                                min="1"
                                max="31"
                            />
                            <p className="text-xs text-muted-foreground">
                                Day of the month when your credit card statement is generated
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        {card && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={loading}
                                className="mr-auto"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </>
                                )}
                            </Button>
                        )}
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                card ? 'Update' : 'Create'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
