import { BankDashboardPage } from '@/domains/bank-dashboard/ui/BankDashboardPage';

export default async function Page({ params }: { params: Promise<{ bankCode: string }> }) {
  const { bankCode } = await params;
  return <BankDashboardPage bankCode={bankCode} />;
}