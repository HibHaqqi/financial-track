import DashboardClient from '@/components/dashboard-client';
import { getTransactions, getWallets, getCategories, getCreditCards, getActiveInstallments } from '@/lib/data';
import Header from '@/components/header';

import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const transactions = await getTransactions(session.user.id);
  const wallets = await getWallets(session.user.id);
  const categories = await getCategories(session.user.id);
  const creditCards = await getCreditCards(session.user.id);
  const installments = await getActiveInstallments(session.user.id);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <DashboardClient
          transactions={transactions}
          wallets={wallets}
          categories={categories}
          creditCards={creditCards}
          installments={installments}
        />
      </main>
    </div>
  );
}