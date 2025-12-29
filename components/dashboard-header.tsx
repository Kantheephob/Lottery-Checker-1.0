"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

type BetLimit = {
  limit_id: string
  category: string
  bet_type: string
  max_amount: number
}

export function DashboardHeader() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [maxBets, setMaxBets] = useState({
    threeTop: { left: 0, right: 0 },
    threeBottom: { left: 0, right: 0 },
    twoTop: { left: 0, right: 0 },
    twoBottom: { left: 0, right: 0 },
  })
  const [tempMaxBets, setTempMaxBets] = useState(maxBets)

  useEffect(() => {
    loadBetLimits()
  }, [])

  const loadBetLimits = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("bet_limits").select("*")

      if (error) throw error

      if (data) {
        const limits = data as BetLimit[]
        const newMaxBets = {
          threeTop: { left: 0, right: 0 },
          threeBottom: { left: 0, right: 0 },
          twoTop: { left: 0, right: 0 },
          twoBottom: { left: 0, right: 0 },
        }

        limits.forEach((limit) => {
          const amount = limit.max_amount
          if (limit.category === "3_top" && limit.bet_type === "direct") {
            newMaxBets.threeTop.left = amount
          } else if (limit.category === "3_top" && limit.bet_type === "indirect") {
            newMaxBets.threeTop.right = amount
          } else if (limit.category === "3_bottom" && limit.bet_type === "direct") {
            newMaxBets.threeBottom.left = amount
          } else if (limit.category === "3_bottom" && limit.bet_type === "indirect") {
            newMaxBets.threeBottom.right = amount
          } else if (limit.category === "2_top" && limit.bet_type === "direct") {
            newMaxBets.twoTop.left = amount
          } else if (limit.category === "2_top" && limit.bet_type === "indirect") {
            newMaxBets.twoTop.right = amount
          } else if (limit.category === "2_bottom" && limit.bet_type === "direct") {
            newMaxBets.twoBottom.left = amount
          } else if (limit.category === "2_bottom" && limit.bet_type === "indirect") {
            newMaxBets.twoBottom.right = amount
          }
        })

        setMaxBets(newMaxBets)
        console.log("[v0] Loaded bet limits:", newMaxBets)
      }
    } catch (error) {
      console.error("[v0] Error loading bet limits:", error)
    }
  }

  const handleOpenModal = () => {
    setTempMaxBets({ ...maxBets })
    setIsEditModalOpen(true)
  }

  const handleCancel = () => {
    setIsEditModalOpen(false)
    setTempMaxBets(maxBets)
  }

  const handleConfirm = async () => {
    try {
      const supabase = createClient()

      // Update all bet limits
      const updates = [
        { category: "3_top", bet_type: "direct", max_amount: tempMaxBets.threeTop.left },
        { category: "3_top", bet_type: "indirect", max_amount: tempMaxBets.threeTop.right },
        { category: "3_bottom", bet_type: "direct", max_amount: tempMaxBets.threeBottom.left },
        { category: "3_bottom", bet_type: "indirect", max_amount: tempMaxBets.threeBottom.right },
        { category: "2_top", bet_type: "direct", max_amount: tempMaxBets.twoTop.left },
        { category: "2_top", bet_type: "indirect", max_amount: tempMaxBets.twoTop.right },
        { category: "2_bottom", bet_type: "direct", max_amount: tempMaxBets.twoBottom.left },
        { category: "2_bottom", bet_type: "indirect", max_amount: tempMaxBets.twoBottom.right },
      ]

      for (const update of updates) {
        const { error } = await supabase
          .from("bet_limits")
          .update({ max_amount: update.max_amount })
          .eq("category", update.category)
          .eq("bet_type", update.bet_type)

        if (error) throw error
      }

      setMaxBets({ ...tempMaxBets })
      setIsEditModalOpen(false)
      console.log("[v0] Updated bet limits successfully")
    } catch (error) {
      console.error("[v0] Error updating bet limits:", error)
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล")
    }
  }

  const handleInputChange = (category: keyof typeof tempMaxBets, side: "left" | "right", value: string) => {
    const numValue = Number.parseInt(value)
    if (value === "" || (numValue >= 0 && !Number.isNaN(numValue))) {
      setTempMaxBets({
        ...tempMaxBets,
        [category]: { ...tempMaxBets[category], [side]: value === "" ? 0 : numValue },
      })
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-gray-800/30 backdrop-blur-sm border-b border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button className="bg-gray-600 text-white hover:bg-gray-700 border-0 rounded-lg px-6 py-2 font-semibold text-base">
              จำนวนรับสูงสุด
            </Button>
            <Button
              onClick={handleOpenModal}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 text-white border-0 rounded-lg px-6 py-2 font-semibold text-base"
            >
              แก้ไขยอดรับสูงสุด
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white font-semibold text-lg">admin</span>
            <Link href="/">
              <Button
                variant="destructive"
                className="bg-red-500 hover:bg-red-600 text-white border-0 rounded-lg px-6 py-2 font-semibold text-base"
              >
                Logout
              </Button>
            </Link>
          </div>
        </div>
        <div className="px-4 pb-3 flex gap-4 text-base">
          <div className="flex items-center bg-gray-600 rounded-full overflow-hidden">
            <span className="px-4 py-1.5 text-white font-medium">3 ตัวบน:</span>
            <span className="px-4 py-1.5 bg-[#00cc00] text-white font-medium">
              {maxBets.threeTop.left} × {maxBets.threeTop.right}
            </span>
          </div>
          <div className="flex items-center bg-gray-600 rounded-full overflow-hidden">
            <span className="px-4 py-1.5 text-white font-medium">3 ตัวล่าง:</span>
            <span className="px-4 py-1.5 bg-[#00cc00] text-white font-medium">
              {maxBets.threeBottom.left} × {maxBets.threeBottom.right}
            </span>
          </div>
          <div className="flex items-center bg-gray-600 rounded-full overflow-hidden">
            <span className="px-4 py-1.5 text-white font-medium">2 ตัวบน:</span>
            <span className="px-4 py-1.5 bg-[#00cc00] text-white font-medium">
              {maxBets.twoTop.left} × {maxBets.twoTop.right}
            </span>
          </div>
          <div className="flex items-center bg-gray-600 rounded-full overflow-hidden">
            <span className="px-4 py-1.5 text-white font-medium">2 ตัวล่าง:</span>
            <span className="px-4 py-1.5 bg-[#00cc00] text-white font-medium">
              {maxBets.twoBottom.left} × {maxBets.twoBottom.right}
            </span>
          </div>
        </div>
      </header>

      <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="bg-gray-200 max-w-4xl p-8">
          <div className="space-y-4">
            {/* 3 ตัวบน */}
            <div className="bg-gray-600 rounded-xl p-6 flex items-center gap-4">
              <span className="text-white font-semibold text-2xl min-w-[120px]">3 ตัวบน</span>
              <Input
                type="number"
                min="0"
                value={tempMaxBets.threeTop.left}
                onChange={(e) => handleInputChange("threeTop", "left", e.target.value)}
                className="bg-white border-gray-400 text-center text-xl h-12 max-w-[150px]"
              />
              <span className="text-white text-3xl font-bold">x</span>
              <Input
                type="number"
                min="0"
                value={tempMaxBets.threeTop.right}
                onChange={(e) => handleInputChange("threeTop", "right", e.target.value)}
                className="bg-white border-gray-400 text-center text-xl h-12 max-w-[150px]"
              />
            </div>

            {/* 3 ตัวล่าง */}
            <div className="bg-gray-600 rounded-xl p-6 flex items-center gap-4">
              <span className="text-white font-semibold text-2xl min-w-[120px]">3 ตัวล่าง</span>
              <Input
                type="number"
                min="0"
                value={tempMaxBets.threeBottom.left}
                onChange={(e) => handleInputChange("threeBottom", "left", e.target.value)}
                className="bg-white border-gray-400 text-center text-xl h-12 max-w-[150px]"
              />
              <span className="text-white text-3xl font-bold">x</span>
              <Input
                type="number"
                min="0"
                value={tempMaxBets.threeBottom.right}
                onChange={(e) => handleInputChange("threeBottom", "right", e.target.value)}
                className="bg-white border-gray-400 text-center text-xl h-12 max-w-[150px]"
              />
            </div>

            {/* 2 ตัวบน */}
            <div className="bg-gray-600 rounded-xl p-6 flex items-center gap-4">
              <span className="text-white font-semibold text-2xl min-w-[120px]">2 ตัวบน</span>
              <Input
                type="number"
                min="0"
                value={tempMaxBets.twoTop.left}
                onChange={(e) => handleInputChange("twoTop", "left", e.target.value)}
                className="bg-white border-gray-400 text-center text-xl h-12 max-w-[150px]"
              />
              <span className="text-white text-3xl font-bold">x</span>
              <Input
                type="number"
                min="0"
                value={tempMaxBets.twoTop.right}
                onChange={(e) => handleInputChange("twoTop", "right", e.target.value)}
                className="bg-white border-gray-400 text-center text-xl h-12 max-w-[150px]"
              />
            </div>

            {/* 2 ตัวล่าง */}
            <div className="bg-gray-600 rounded-xl p-6 flex items-center gap-4">
              <span className="text-white font-semibold text-2xl min-w-[120px]">2 ตัวล่าง</span>
              <Input
                type="number"
                min="0"
                value={tempMaxBets.twoBottom.left}
                onChange={(e) => handleInputChange("twoBottom", "left", e.target.value)}
                className="bg-white border-gray-400 text-center text-xl h-12 max-w-[150px]"
              />
              <span className="text-white text-3xl font-bold">x</span>
              <Input
                type="number"
                min="0"
                value={tempMaxBets.twoBottom.right}
                onChange={(e) => handleInputChange("twoBottom", "right", e.target.value)}
                className="bg-white border-gray-400 text-center text-xl h-12 max-w-[150px]"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-between pt-4">
              <Button
                onClick={handleCancel}
                className="bg-red-500 hover:bg-red-600 text-white text-2xl font-bold px-12 py-6 rounded-xl"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-[#00cc00] hover:bg-[#00aa00] text-white text-2xl font-bold px-12 py-6 rounded-xl"
              >
                ยืนยัน
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
