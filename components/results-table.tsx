"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Pencil, Trash2, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type BetData = {
  bet_id: string
  order_id: string
  bet_number: number
  category: string
  bet_type: string
  amount: number
  cus_name: string
  lot_num: string
  created_at: string
}

type BetLimit = {
  category: string
  bet_type: string
  max_amount: number
}

type SortConfig = {
  key: keyof BetData | null
  direction: "asc" | "desc"
}

export function ResultsTable() {
  const [bets, setBets] = useState<BetData[]>([])
  const [betLimits, setBetLimits] = useState<BetLimit[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: "asc" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadBetsAndLimits()

    const interval = setInterval(loadBetsAndLimits, 3000)

    const handleUpdate = () => loadBetsAndLimits()
    window.addEventListener("lottery-update", handleUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener("lottery-update", handleUpdate)
    }
  }, [])

  const loadBetsAndLimits = async () => {
    try {
      const supabase = createClient()

      // Load bet limits
      const { data: limitsData, error: limitsError } = await supabase.from("bet_limits").select("*")

      if (limitsError) throw limitsError
      setBetLimits(limitsData || [])

      // Load bets with customer and lottery info
      const { data: betsData, error: betsError } = await supabase
        .from("bets")
        .select(`
          *,
          orders!inner(
            lot_num,
            customers!inner(cus_name)
          )
        `)
        .order("created_at", { ascending: false })

      if (betsError) throw betsError

      const transformedBets = (betsData || []).map((bet: any) => ({
        bet_id: bet.bet_id,
        order_id: bet.order_id,
        bet_number: bet.bet_number,
        category: bet.category,
        bet_type: bet.bet_type,
        amount: bet.amount,
        created_at: bet.created_at,
        cus_name: bet.orders.customers.cus_name,
        lot_num: bet.orders.lot_num,
      }))

      setBets(transformedBets)
    } catch (error) {
      console.error("[v0] Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateWarning = (bet: BetData): string | null => {
    // Calculate total for this lottery number, category, and bet type
    const sameBets = bets.filter(
      (b) =>
        b.lot_num === bet.lot_num &&
        b.category === bet.category &&
        b.bet_type === bet.bet_type &&
        new Date(b.created_at) <= new Date(bet.created_at),
    )

    const total = sameBets.reduce((sum, b) => sum + b.amount, 0)

    // Find the limit for this category and bet type
    const limit = betLimits.find((l) => l.category === bet.category && l.bet_type === bet.bet_type)

    if (!limit || total <= limit.max_amount) return null

    // Only show warning on the newest bet
    const newestBet = sameBets.reduce((newest, current) =>
      new Date(current.created_at) > new Date(newest.created_at) ? current : newest,
    )

    if (newestBet.bet_id !== bet.bet_id) return null

    const exceeded = total - limit.max_amount
    const categoryName =
      bet.category === "3_top"
        ? "3 ตัวบน"
        : bet.category === "3_bottom"
          ? "3 ตัวล่าง"
          : bet.category === "2_top"
            ? "2 ตัวบน"
            : "2 ตัวล่าง"
    const typeName = bet.bet_type === "direct" ? "ตรง" : "โต๊ด"

    return `เกิน ${categoryName}${typeName} ${exceeded}`
  }

  const handleSort = (key: keyof BetData) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const sortedBets = [...bets].sort((a, b) => {
    if (!sortConfig.key) return 0

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
    return 0
  })

  const filteredBets = sortedBets.filter(
    (bet) => bet.cus_name.toLowerCase().includes(searchQuery.toLowerCase()) || bet.lot_num.includes(searchQuery),
  )

  const totalPages = Math.ceil(filteredBets.length / itemsPerPage)
  const paginatedBets = filteredBets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleEdit = (bet: BetData) => {
    setEditingId(bet.bet_id)
    setEditAmount(bet.amount.toString())
  }

  const handleSaveEdit = async (betId: string) => {
    try {
      const supabase = createClient()
      const newAmount = Number.parseInt(editAmount)

      if (isNaN(newAmount) || newAmount <= 0) {
        alert("กรุณากรอกจำนวนเงินที่ถูกต้อง")
        return
      }

      const { error } = await supabase.from("bets").update({ amount: newAmount }).eq("bet_id", betId)

      if (error) throw error

      setEditingId(null)
      setEditAmount("")
      await loadBetsAndLimits()
    } catch (error) {
      console.error("[v0] Error updating bet:", error)
      alert("เกิดข้อผิดพลาดในการแก้ไขข้อมูล")
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditAmount("")
  }

  const handleDelete = async (betId: string) => {
    if (!confirm("คุณต้องการลบรายการนี้หรือไม่?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("bets").delete().eq("bet_id", betId)

      if (error) throw error

      await loadBetsAndLimits()
    } catch (error) {
      console.error("[v0] Error deleting bet:", error)
      alert("เกิดข้อผิดพลาดในการลบข้อมูล")
    }
  }

  const formatCategory = (category: string, bet_type: string) => {
    const baseName =
      category === "3_top"
        ? "3 ตัวบน"
        : category === "3_bottom"
          ? "3 ตัวล่าง"
          : category === "2_top"
            ? "2 ตัวบน"
            : "2 ตัวล่าง"

    const typeName = bet_type === "direct" ? "ตรง" : "โต๊ด"

    return `${baseName}${typeName}`
  }

  const formatBetType = (type: string) => {
    return type === "direct" ? "ตรง" : "โต๊ด"
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <h2 className="bg-gray-600 text-white text-xl font-semibold py-3 px-12 rounded-lg">ข้อมูลลูกค้า</h2>
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
                onClick={() => handleSort("amount")}
              >
                จำนวน {sortConfig.key === "amount" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="text-center text-white font-semibold text-base border-r-2 border-gray-500">
                หมายเหตุ
              </TableHead>
              <TableHead className="text-center text-white font-semibold text-base">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-[400px] text-center text-gray-400 bg-gray-800/50">
                  กำลังโหลดข้อมูล...
                </TableCell>
              </TableRow>
            ) : paginatedBets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-[400px] text-center text-gray-400 bg-gray-800/50">
                  ไม่มีข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              paginatedBets.map((bet) => {
                const warning = calculateWarning(bet)
                const isEditing = editingId === bet.bet_id
                return (
                  <TableRow key={bet.bet_id} className="border-b border-gray-600 hover:bg-gray-800/30">
                    <TableCell className="text-center text-white border-r-2 border-gray-600">{bet.cus_name}</TableCell>
                    <TableCell className="text-center text-white border-r-2 border-gray-600">{bet.lot_num}</TableCell>
                    <TableCell className="text-center text-white border-r-2 border-gray-600">
                      {formatCategory(bet.category, bet.bet_type)}
                    </TableCell>
                    <TableCell className="text-center text-white border-r-2 border-gray-600">
                      {isEditing ? (
                        <Input
                          value={editAmount}
                          onChange={(e) => {
                            if (e.target.value === "" || /^\d+$/.test(e.target.value)) {
                              setEditAmount(e.target.value)
                            }
                          }}
                          className="w-20 mx-auto bg-white text-gray-900 text-center"
                          style={{ colorScheme: "light" }}
                        />
                      ) : (
                        bet.amount
                      )}
                    </TableCell>
                    <TableCell className="text-center border-r-2 border-gray-600">
                      {isEditing ? (
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white p-1"
                            onClick={() => handleSaveEdit(bet.bet_id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-red-500 hover:bg-red-600 text-white p-1"
                            onClick={handleCancelEdit}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        warning && <span className="text-red-500 font-semibold">{warning}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {!isEditing && (
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white p-2"
                            onClick={() => handleEdit(bet)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-red-500 hover:bg-red-600 text-white p-2"
                            onClick={() => handleDelete(bet.bet_id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
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
