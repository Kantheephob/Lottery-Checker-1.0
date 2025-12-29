import { DashboardHeader } from "@/components/dashboard-header"
import { LotteryForm } from "@/components/lottery-form"
import { ResultsTable } from "@/components/results-table"
import { HistoryTable } from "@/components/history-table"
import { ComparisonTable } from "@/components/comparison-table"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2332] via-[#1f3a52] to-[#1a2838]">
      <DashboardHeader />
      <main className="p-4 space-y-6">
        <LotteryForm />
        <ResultsTable />
        <HistoryTable />
        <ComparisonTable />
      </main>
    </div>
  )
}
