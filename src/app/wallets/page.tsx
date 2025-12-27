import Header from '@/components/header';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import WalletsClient from '@/components/wallets-client';
import { getWallets, getTransactions, getCategories } from '@/lib/data';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function WalletsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const wallets = await getWallets(session.user.id);
  const transactions = await getTransactions(session.user.id);
  const categories = await getCategories(session.user.id);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 pb-20 sm:pb-4 md:pb-8">
        <WalletsClient wallets={wallets} transactions={transactions} categories={categories} userId={session.user.id} />
      </main>
      <MobileBottomNav />
    </div>
  );
}
