"use client"

import type React from "react"

import { useState, useEffect, useRef, type KeyboardEvent } from "react"
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
    threeTopDirect: 0,
    threeTopIndirect: 0,
    threeBottomDirect: 0,
    twoTopDirect: 0,
    twoBottomDirect: 0,
  })
  const [tempMaxBets, setTempMaxBets] = useState(maxBets)

  const threeTopDirectRef = useRef<HTMLInputElement>(null)
  const threeTopIndirectRef = useRef<HTMLInputElement>(null)
  const threeBottomDirectRef = useRef<HTMLInputElement>(null)
  const twoTopDirectRef = useRef<HTMLInputElement>(null)
  const twoBottomDirectRef = useRef<HTMLInputElement>(null)

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
          threeTopDirect: 0,
          threeTopIndirect: 0,
          threeBottomDirect: 0,
          twoTopDirect: 0,
          twoBottomDirect: 0,
        }

        limits.forEach((limit) => {
          const amount = limit.max_amount
          if (limit.category === "3_top" && limit.bet_type === "direct") {
            newMaxBets.threeTopDirect = amount
          } else if (limit.category === "3_top" && limit.bet_type === "indirect") {
            newMaxBets.threeTopIndirect = amount
          } else if (limit.category === "3_bottom" && limit.bet_type === "direct") {
            newMaxBets.threeBottomDirect = amount
          } else if (limit.category === "2_top" && limit.bet_type === "direct") {
            newMaxBets.twoTopDirect = amount
          } else if (limit.category === "2_bottom" && limit.bet_type === "direct") {
            newMaxBets.twoBottomDirect = amount
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

      const updates = [
        { category: "3_top", bet_type: "direct", max_amount: tempMaxBets.threeTopDirect },
        { category: "3_top", bet_type: "indirect", max_amount: tempMaxBets.threeTopIndirect },
        { category: "3_bottom", bet_type: "direct", max_amount: tempMaxBets.threeBottomDirect },
        { category: "2_top", bet_type: "direct", max_amount: tempMaxBets.twoTopDirect },
        { category: "2_bottom", bet_type: "direct", max_amount: tempMaxBets.twoBottomDirect },
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

  const handleInputChange = (key: keyof typeof tempMaxBets, value: string) => {
    const numValue = Number.parseInt(value)
    if (value === "" || (numValue >= 0 && !Number.isNaN(numValue))) {
      setTempMaxBets({
        ...tempMaxBets,
        [key]: value === "" ? 0 : numValue,
      })
    }
  }

  const handleModalKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    nextRef: React.RefObject<HTMLInputElement | null> | null,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (nextRef?.current) {
        nextRef.current.focus()
      } else {
        handleConfirm()
      }
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-gray-800/30 backdrop-blur-sm border-b border-gray-700">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 md:p-4 gap-3 md:gap-0">
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <Button className="bg-gray-600 text-white hover:bg-gray-700 border-0 rounded-lg px-4 md:px-6 py-2 font-semibold text-sm md:text-base">
              จำนวนรับสูงสุด
            </Button>
            <Button
              onClick={handleOpenModal}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 text-white border-0 rounded-lg px-4 md:px-6 py-2 font-semibold text-sm md:text-base"
            >
              แก้ไขยอดรับสูงสุด
            </Button>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-white font-semibold text-base md:text-lg">admin</span>
            <Link href="/">
              <Button
                variant="destructive"
                className="bg-red-500 hover:bg-red-600 text-white border-0 rounded-lg px-4 md:px-6 py-2 font-semibold text-sm md:text-base"
              >
                Logout
              </Button>
            </Link>
          </div>
        </div>
        <div className="px-3 md:px-4 pb-3 flex flex-wrap gap-2 md:gap-4 text-xs md:text-base">
          <div className="flex items-center bg-gray-600 rounded-full overflow-hidden">
            <span className="px-3 md:px-4 py-1 md:py-1.5 text-white font-medium">3 ตัวบน:</span>
            <span className="px-3 md:px-4 py-1 md:py-1.5 bg-[#00cc00] text-white font-medium">
              {maxBets.threeTopDirect} × {maxBets.threeTopIndirect}
            </span>
          </div>
          <div className="flex items-center bg-gray-600 rounded-full overflow-hidden">
            <span className="px-3 md:px-4 py-1 md:py-1.5 text-white font-medium">3 ตัวล่าง:</span>
            <span className="px-3 md:px-4 py-1 md:py-1.5 bg-[#00cc00] text-white font-medium">
              {maxBets.threeBottomDirect}
            </span>
          </div>
          <div className="flex items-center bg-gray-600 rounded-full overflow-hidden">
            <span className="px-3 md:px-4 py-1 md:py-1.5 text-white font-medium">2 ตัวบน:</span>
            <span className="px-3 md:px-4 py-1 md:py-1.5 bg-[#00cc00] text-white font-medium">
              {maxBets.twoTopDirect}
            </span>
          </div>
          <div className="flex items-center bg-gray-600 rounded-full overflow-hidden">
            <span className="px-3 md:px-4 py-1 md:py-1.5 text-white font-medium">2 ตัวล่าง:</span>
            <span className="px-3 md:px-4 py-1 md:py-1.5 bg-[#00cc00] text-white font-medium">
              {maxBets.twoBottomDirect}
            </span>
          </div>
        </div>
      </header>

      <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="bg-gradient-to-br from-[#2a3442] via-[#2f4a62] to-[#2a3848] border-gray-600 max-w-2xl md:max-w-4xl p-4 md:p-8 flex items-center justify-center">
          <div className="space-y-3 md:space-y-4 w-full">
            <div className="bg-gray-700/80 rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-3 md:gap-4">
              <span className="text-white font-semibold text-lg md:text-2xl min-w-[100px] md:min-w-[120px]">
                3 ตัวบน
              </span>
              <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                <Input
                  ref={threeTopDirectRef}
                  type="number"
                  min="0"
                  value={tempMaxBets.threeTopDirect}
                  onChange={(e) => handleInputChange("threeTopDirect", e.target.value)}
                  onKeyDown={(e) => handleModalKeyDown(e, threeTopIndirectRef)}
                  className="bg-white border-gray-400 text-gray-900 text-center text-base md:text-xl h-10 md:h-12 flex-1 md:max-w-[150px]"
                  style={{ colorScheme: "light" }}
                />
                <span className="text-white text-2xl md:text-3xl font-bold">x</span>
                <Input
                  ref={threeTopIndirectRef}
                  type="number"
                  min="0"
                  value={tempMaxBets.threeTopIndirect}
                  onChange={(e) => handleInputChange("threeTopIndirect", e.target.value)}
                  onKeyDown={(e) => handleModalKeyDown(e, threeBottomDirectRef)}
                  className="bg-white border-gray-400 text-gray-900 text-center text-base md:text-xl h-10 md:h-12 flex-1 md:max-w-[150px]"
                  style={{ colorScheme: "light" }}
                />
              </div>
            </div>

            <div className="bg-gray-700/80 rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-3 md:gap-4">
              <span className="text-white font-semibold text-lg md:text-2xl min-w-[100px] md:min-w-[120px]">
                3 ตัวล่าง
              </span>
              <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                <Input
                  ref={threeBottomDirectRef}
                  type="number"
                  min="0"
                  value={tempMaxBets.threeBottomDirect}
                  onChange={(e) => handleInputChange("threeBottomDirect", e.target.value)}
                  onKeyDown={(e) => handleModalKeyDown(e, twoTopDirectRef)}
                  className="bg-white border-gray-400 text-gray-900 text-center text-base md:text-xl h-10 md:h-12 flex-1 md:max-w-[320px]"
                  style={{ colorScheme: "light" }}
                />
              </div>
            </div>

            <div className="bg-gray-700/80 rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-3 md:gap-4">
              <span className="text-white font-semibold text-lg md:text-2xl min-w-[100px] md:min-w-[120px]">
                2 ตัวบน
              </span>
              <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                <Input
                  ref={twoTopDirectRef}
                  type="number"
                  min="0"
                  value={tempMaxBets.twoTopDirect}
                  onChange={(e) => handleInputChange("twoTopDirect", e.target.value)}
                  onKeyDown={(e) => handleModalKeyDown(e, twoBottomDirectRef)}
                  className="bg-white border-gray-400 text-gray-900 text-center text-base md:text-xl h-10 md:h-12 flex-1 md:max-w-[320px]"
                  style={{ colorScheme: "light" }}
                />
              </div>
            </div>

            <div className="bg-gray-700/80 rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-3 md:gap-4">
              <span className="text-white font-semibold text-lg md:text-2xl min-w-[100px] md:min-w-[120px]">
                2 ตัวล่าง
              </span>
              <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                <Input
                  ref={twoBottomDirectRef}
                  type="number"
                  min="0"
                  value={tempMaxBets.twoBottomDirect}
                  onChange={(e) => handleInputChange("twoBottomDirect", e.target.value)}
                  onKeyDown={(e) => handleModalKeyDown(e, null)}
                  className="bg-white border-gray-400 text-gray-900 text-center text-base md:text-xl h-10 md:h-12 flex-1 md:max-w-[320px]"
                  style={{ colorScheme: "light" }}
                />
              </div>
            </div>

            <div className="flex justify-between gap-4 pt-2 md:pt-4">
              <Button
                onClick={handleCancel}
                className="bg-red-500 hover:bg-red-600 text-white text-lg md:text-2xl font-bold px-8 md:px-12 py-4 md:py-6 rounded-xl"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-[#00cc00] hover:bg-[#00aa00] text-white text-lg md:text-2xl font-bold px-8 md:px-12 py-4 md:py-6 rounded-xl"
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
