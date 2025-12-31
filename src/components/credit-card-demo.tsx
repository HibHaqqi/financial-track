'use client';

import CreditCardWidget from './credit-card-widget';

export default function CreditCardDemo() {
    // Mock data untuk demo
    const mockCreditCards = [
        {
            id: '1',
            name: 'BCA Platinum',
            totalLimit: 50000000,
            usedLimit: 15000000,
            billingDate: 25,
            userId: 'demo-user',
        },
        {
            id: '2',
            name: 'Mandiri Gold',
            totalLimit: 30000000,
            usedLimit: 8000000,
            billingDate: 10,
            userId: 'demo-user',
        },
    ];

    const mockInstallments = [
        {
            id: '1',
            description: 'MacBook Pro M3 - Apple Store',
            totalAmount: 24000000,
            monthlyPayment: 2000000,
            tenor: 12,
            currentInstallment: 3,
            startDate: new Date('2024-11-01'),
            creditCardId: '1',
            categoryId: 'cat-1',
        },
        {
            id: '2',
            description: 'iPhone 15 Pro Max',
            totalAmount: 18000000,
            monthlyPayment: 3000000,
            tenor: 6,
            currentInstallment: 2,
            startDate: new Date('2024-12-01'),
            creditCardId: '1',
            categoryId: 'cat-2',
        },
        {
            id: '3',
            description: 'Kulkas Samsung 2 Pintu',
            totalAmount: 8000000,
            monthlyPayment: 1333333,
            tenor: 6,
            currentInstallment: 1,
            startDate: new Date('2025-01-01'),
            creditCardId: '2',
            categoryId: 'cat-3',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-blue-900">
                    Credit Cards Demo
                </h1>
                <p className="text-blue-700 mt-2">
                    Ini adalah preview UI untuk fitur Credit Card. Data ditampilkan adalah mock data untuk demo.
                </p>
                <p className="text-sm text-blue-600 mt-1 font-semibold">
                    ✅ Front-end sudah 100% selesai | ⏳ Backend API belum dibuat
                </p>
            </div>

            <CreditCardWidget
                creditCards={mockCreditCards}
                installments={mockInstallments}
                onRefresh={() => alert('Refresh functionality! (Backend needed)')}
            />

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                            Note: Demo Mode
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                            <p>
                                Fitur yang aktif saat ini hanya UI/tampilan. Untuk mengaktifkan penyimpanan data, perlu:
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Jalankan database migration</li>
                                <li>Buat API routes untuk CRUD credit cards</li>
                                <li>Buat API routes untuk installments</li>
                                <li>Update transaction API untuk support cicilan</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
