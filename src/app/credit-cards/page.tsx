import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Header from '@/components/header';
import CreditCardDemo from '@/components/credit-card-demo';

export default async function CreditCardsPage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect('/login');
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 p-4 sm:p-6 md:p-8">
                <CreditCardDemo />
            </main>
        </div>
    );
}
