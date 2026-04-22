// src/domains/bank-dashboard/ui/BankDashboardPage.tsx
import { fetchDeals } from '@/domains/bank-dashboard/api/fetchDeals';
import { DealTable } from './DealTables';
 

export async function BankDashboardPage() {
  const deals = await fetchDeals();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Банковский дашборд</h1>
      <DealTable deals={deals} />
    </div>
  );
}