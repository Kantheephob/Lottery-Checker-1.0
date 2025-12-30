"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type LotterySummary = {
  lot_num: string
  category: string
  direct_total: number
  indirect_total: number
  grand_total: number
}

type SortConfig = {
  key: keyof LotterySummary | null
  direction: "asc" | "desc"
}

export function HistoryTable() {
  const [summaries, setSummaries] = useState<LotterySummary[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: "asc" })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadSummaries()

    const interval = setInterval(loadSummaries, 3000)

    const handleUpdate = () => loadSummaries()
    window.addEventListener("lottery-update", handleUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener("lottery-update", handleUpdate)
    }
  }, [])

  const loadSummaries = async () => {
    try {
      const supabase = createClient()

      const { data: betsData, error } = await supabase.from("bets").select(`
          *,
          orders!inner(lot_num)
        `)

      if (error) throw error

      // Group by lot_num and category
      const grouped = new Map<string, LotterySummary>()

      betsData?.forEach((bet: any) => {
        const key = `${bet.orders.lot_num}-${bet.category}`
        if (!grouped.has(key)) {
          grouped.set(key, {
            lot_num: bet.orders.lot_num,
            category: bet.category,
            direct_total: 0,
            indirect_total: 0,
            grand_total: 0,
          })
        }

        const summary = grouped.get(key)!
        if (bet.bet_type === "direct") {
          summary.direct_total += bet.amount
        } else {
          summary.indirect_total += bet.amount
        }
        summary.grand_total += bet.amount
      })

      setSummaries(Array.from(grouped.values()))
    } catch (error) {
      console.error("[v0] Error loading summaries:", error)
    }
  }

  const handleSort = (key: keyof LotterySummary) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const sortedSummaries = [...summaries].sort((a, b) => {
    if (!sortConfig.key) return 0

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  const filteredSummaries = sortedSummaries.filter((summary) => summary.lot_num.includes(searchQuery))

  const totalPages = Math.ceil(filteredSummaries.length / itemsPerPage)
  const paginatedSummaries = filteredSummaries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const formatCategory = (category: string) => {
    switch (category) {
      case "3_top":
        return "3 ตัวบน"
      case "3_bottom":
        return "3 ตัวล่าง"
      case "2_top":
        return "2 ตัวบน"
      case "2_bottom":
        return "2 ตัวล่าง"
      default:
        return category
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <h2 className="bg-gray-600 text-white text-xl font-semibold py-3 px-12 rounded-lg">สรุปยอดซื้อรวมต่อเลข</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="ค้นหาเลขหวย..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setCurrentPage(1)
          }}
          className="bg-gray-600 border-0 pl-12 py-6 rounded-lg text-base text-white placeholder:text-gray-400"
        />
      </div>

      <div className="border-2 border-gray-500 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-700 hover:bg-gray-700 border-b-2 border-gray-500">
              <TableHead
                className="text-center text-white font-semibold text-base border-r-2 border-gray-500 cursor-pointer hover:bg-gray-600"
                onClick={() => handleSort("lot_num")}
              >
                เลขหวย {sortConfig.key === "lot_num" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="text-center text-white font-semibold text-base border-r-2 border-gray-500 cursor-pointer hover:bg-gray-600"
                onClick={() => handleSort("category")}
              >
                ประเภท {sortConfig.key === "category" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="text-center text-white font-semibold text-base border-r-2 border-gray-500 cursor-pointer hover:bg-gray-600"
                onClick={() => handleSort("direct_total")}
              >
                ยอดซื้อตรง {sortConfig.key === "direct_total" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="text-center text-white font-semibold text-base border-r-2 border-gray-500 cursor-pointer hover:bg-gray-600"
                onClick={() => handleSort("indirect_total")}
              >
                ยอดซื้อโต๊ด {sortConfig.key === "indirect_total" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="text-center text-white font-semibold text-base cursor-pointer hover:bg-gray-600"
                onClick={() => handleSort("grand_total")}
              >
                ยอดซื้อรวม {sortConfig.key === "grand_total" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSummaries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-[400px] text-center text-gray-400 bg-gray-800/50">
                  ไม่มีข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              paginatedSummaries.map((summary, index) => (
                <TableRow
                  key={`${summary.lot_num}-${summary.category}-${index}`}
                  className="border-b border-gray-600 hover:bg-gray-800/30"
                >
                  <TableCell className="text-center text-white border-r-2 border-gray-600">{summary.lot_num}</TableCell>
                  <TableCell className="text-center text-white border-r-2 border-gray-600">
                    {formatCategory(summary.category)}
                  </TableCell>
                  <TableCell className="text-center text-white border-r-2 border-gray-600">
                    {summary.direct_total.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center text-white border-r-2 border-gray-600">
                    {summary.indirect_total.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center text-white">{summary.grand_total.toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center items-center gap-8">
        <Button
          className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold text-base"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          ก่อนหน้า
        </Button>
        <span className="text-white font-normal text-lg">
          หน้า {currentPage} จาก {totalPages || 1}
        </span>
        <Button
          className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold text-base"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          ถัดไป
        </Button>
      </div>
    </div>
  )
}
