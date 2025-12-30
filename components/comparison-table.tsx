"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type CustomerSummary = {
  cus_name: string
  lot_nums: string[] // Array of all lottery numbers
  top_direct: number
  top_indirect: number
  bottom_direct: number
  bottom_indirect: number
  grand_total: number
}

type SortConfig = {
  key: keyof CustomerSummary | null
  direction: "asc" | "desc"
}

export function ComparisonTable() {
  const [summaries, setSummaries] = useState<CustomerSummary[]>([])
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
          orders!inner(
            lot_num,
            customers!inner(cus_name)
          )
        `)

      if (error) throw error

      const grouped = new Map<string, CustomerSummary>()

      betsData?.forEach((bet: any) => {
        const key = bet.orders.customers.cus_name
        if (!grouped.has(key)) {
          grouped.set(key, {
            cus_name: bet.orders.customers.cus_name,
            lot_nums: [],
            top_direct: 0,
            top_indirect: 0,
            bottom_direct: 0,
            bottom_indirect: 0,
            grand_total: 0,
          })
        }

        const summary = grouped.get(key)!

        // Add lottery number if not already in the list
        if (!summary.lot_nums.includes(bet.orders.lot_num)) {
          summary.lot_nums.push(bet.orders.lot_num)
        }

        if (bet.category.includes("top") && bet.bet_type === "direct") {
          summary.top_direct += bet.amount
        } else if (bet.category.includes("top") && bet.bet_type === "indirect") {
          summary.top_indirect += bet.amount
        } else if (bet.category.includes("bottom") && bet.bet_type === "direct") {
          summary.bottom_direct += bet.amount
        } else if (bet.category.includes("bottom") && bet.bet_type === "indirect") {
          summary.bottom_indirect += bet.amount
        }

        summary.grand_total += bet.amount
      })

      setSummaries(Array.from(grouped.values()))
    } catch (error) {
      console.error("[v0] Error loading summaries:", error)
    }
  }

  const handleSort = (key: keyof CustomerSummary) => {
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

  const filteredSummaries = sortedSummaries.filter(
    (summary) =>
      summary.cus_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summary.lot_nums.some((num) => num.includes(searchQuery)),
  )

  const totalPages = Math.ceil(filteredSummaries.length / itemsPerPage)
  const paginatedSummaries = filteredSummaries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <h2 className="bg-gray-600 text-white text-xl font-semibold py-3 px-12 rounded-lg">สรุปยอดซื้อรวมต่อลูกค้า</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="ค้นหาชื่อหรือเลขหวย..."
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
                onClick={() => handleSort("cus_name")}
              >
                ผู้ซื้อ {sortConfig.key === "cus_name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="text-center text-white font-semibold text-base border-r-2 border-gray-500">
                เลขหวย
              </TableHead>
              <TableHead
                className="text-center text-white font-semibold text-base border-r-2 border-gray-500 cursor-pointer hover:bg-gray-600"
                onClick={() => handleSort("top_direct")}
              >
                รวมตัวบนตรง {sortConfig.key === "top_direct" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="text-center text-white font-semibold text-base border-r-2 border-gray-500 cursor-pointer hover:bg-gray-600"
                onClick={() => handleSort("top_indirect")}
              >
                รวมตัวบนโต๊ด {sortConfig.key === "top_indirect" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="text-center text-white font-semibold text-base border-r-2 border-gray-500 cursor-pointer hover:bg-gray-600"
                onClick={() => handleSort("bottom_direct")}
              >
                รวมล่างบนตรง {sortConfig.key === "bottom_direct" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="text-center text-white font-semibold text-base border-r-2 border-gray-500 cursor-pointer hover:bg-gray-600"
                onClick={() => handleSort("bottom_indirect")}
              >
                รวมล่างบนโต๊ด {sortConfig.key === "bottom_indirect" && (sortConfig.direction === "asc" ? "↑" : "↓")}
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
                <TableCell colSpan={7} className="h-[400px] text-center text-gray-400 bg-gray-800/50">
                  ไม่มีข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              paginatedSummaries.map((summary, index) => (
                <TableRow
                  key={`${summary.cus_name}-${index}`}
                  className="border-b border-gray-600 hover:bg-gray-800/30"
                >
                  <TableCell className="text-center text-white border-r-2 border-gray-600">
                    {summary.cus_name}
                  </TableCell>
                  <TableCell className="text-center text-white border-r-2 border-gray-600">
                    <div className="flex flex-wrap justify-center gap-1">{summary.lot_nums.sort().join(", ")}</div>
                  </TableCell>
                  <TableCell className="text-center text-white border-r-2 border-gray-600">
                    {summary.top_direct.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center text-white border-r-2 border-gray-600">
                    {summary.top_indirect.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center text-white border-r-2 border-gray-600">
                    {summary.bottom_direct.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center text-white border-r-2 border-gray-600">
                    {summary.bottom_indirect.toLocaleString()}
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
