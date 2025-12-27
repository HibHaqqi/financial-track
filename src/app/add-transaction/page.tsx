
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import TransactionForm from '@/components/transaction-form';
import { getWallets, getCategories } from '@/lib/data';
import Header from '@/components/header';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function AddTransactionPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }
  const wallets = await getWallets(session.user.id);
  const categories = await getCategories(session.user.id);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 pb-28 md:pb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold md:text-2xl">Add Transaction</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Add a New Transaction</CardTitle>
            <CardDescription>
              Fill out the form below to add a new expense or income.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionForm wallets={wallets} categories={categories} />
          </CardContent>
        </Card>
      </main>
      <MobileBottomNav />
    </div>
  );
}
