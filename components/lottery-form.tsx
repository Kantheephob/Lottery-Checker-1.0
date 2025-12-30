"use client"

import type React from "react"

import { useState, useRef, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

type LotteryEntry = {
  id: string
  buyer: string
  number: string
  topStraight: string
  topPermutation: string
  bottomStraight: string
  // bottomPermutation: string // Removed
  timestamp: number
}

export function LotteryForm() {
  const [buyer, setBuyer] = useState("")
  const [number, setNumber] = useState("")
  const [topStraight, setTopStraight] = useState("")
  const [topPermutation, setTopPermutation] = useState("")
  const [bottomStraight, setBottomStraight] = useState("")
  // const [bottomPermutation, setBottomPermutation] = useState("") // Removed

  const buyerRef = useRef<HTMLInputElement>(null)
  const numberRef = useRef<HTMLInputElement>(null)
  const topStraightRef = useRef<HTMLInputElement>(null)
  const topPermutationRef = useRef<HTMLInputElement>(null)
  const bottomStraightRef = useRef<HTMLInputElement>(null)
  // const bottomPermutationRef = useRef<HTMLInputElement>(null) // Removed

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, nextRef: React.RefObject<HTMLInputElement | null> | null) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (nextRef?.current) {
        nextRef.current.focus()
      }
    }
  }

  const handleBuyerChange = (value: string) => {
    // Allow empty or valid name (not starting with number)
    if (value === "" || !/^\d/.test(value)) {
      setBuyer(value)
    }
  }

  const handleNumberChange = (value: string) => {
    // Allow empty or 2-3 digit numbers
    if (value === "" || (/^\d{0,3}$/.test(value) && value.length <= 3)) {
      setNumber(value)
    }
  }

  const handleTableInputChange = (value: string, setter: (value: string) => void) => {
    // Allow empty or positive integers only
    if (value === "" || /^\d+$/.test(value)) {
      setter(value)
    }
  }

  const handleTopPermutationChange = (value: string) => {
    // Check if trying to enter value for 2-digit number (which doesn't support indirect)
    if (value && number.length === 2) {
      alert("เลข 2 หลักไม่มีประเภทโต๊ด มีเฉพาะตรงเท่านั้น")
      return
    }
    handleTableInputChange(value, setTopPermutation)
  }

  const handleAdd = async () => {
    // Validate required fields
    if (!buyer.trim() || !number.trim()) {
      alert("กรุณากรอกผู้ซื้อและเลขหวย")
      return
    }

    // Validate lottery number length (must be 2-3 digits)
    if (number.length < 2 || number.length > 3) {
      alert("เลขหวยต้องมี 2-3 หลักเท่านั้น")
      return
    }

    if (topPermutation && number.length === 2) {
      alert("เลข 2 หลักไม่มีประเภทโต๊ด มีเฉพาะตรงเท่านั้น")
      return
    }

    if (!topStraight && !topPermutation && !bottomStraight) {
      alert("กรุณากรอกยอดเดิมพันอย่างน้อย 1 ช่อง")
      return
    }

    try {
      const supabase = createClient()

      console.log("[v0] Starting bet submission...")

      // 1. Get or create customer
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("cus_id")
        .eq("cus_name", buyer.trim())
        .single()

      let customerId = existingCustomer?.cus_id

      if (!customerId) {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({ cus_name: buyer.trim() })
          .select("cus_id")
          .single()

        if (customerError) throw customerError
        customerId = newCustomer.cus_id
        console.log("[v0] Created new customer:", customerId)
      } else {
        console.log("[v0] Using existing customer:", customerId)
      }

      // 2. Get or create lottery number
      const { data: existingLottery } = await supabase
        .from("lotteries")
        .select("lot_num")
        .eq("lot_num", number)
        .single()

      if (!existingLottery) {
        const { error: lotteryError } = await supabase.from("lotteries").insert({ lot_num: number })

        if (lotteryError) throw lotteryError
        console.log("[v0] Created new lottery number:", number)
      } else {
        console.log("[v0] Using existing lottery number:", number)
      }

      // 3. Create order (using admin_id from current session if available, otherwise null)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          cus_id: customerId,
          lot_num: number,
          admin_id: null, // Will be set when authentication is implemented
        })
        .select("order_id")
        .single()

      if (orderError) throw orderError
      const orderId = orderData.order_id
      console.log("[v0] Created order:", orderId)

      const is3Digit = number.length === 3
      const topCategory = is3Digit ? "3_top" : "2_top"
      const bottomCategory = is3Digit ? "3_bottom" : "2_bottom"

      // 4. Create bets for each non-empty field
      const betsToInsert = []

      if (topStraight) {
        betsToInsert.push({
          order_id: orderId,
          bet_number: number, // Keep as string to support leading zeros
          category: topCategory,
          bet_type: "direct",
          amount: Number.parseInt(topStraight),
        })
      }

      if (topPermutation && is3Digit) {
        betsToInsert.push({
          order_id: orderId,
          bet_number: number,
          category: topCategory,
          bet_type: "indirect",
          amount: Number.parseInt(topPermutation),
        })
      }

      if (bottomStraight) {
        betsToInsert.push({
          order_id: orderId,
          bet_number: number,
          category: bottomCategory,
          bet_type: "direct",
          amount: Number.parseInt(bottomStraight),
        })
      }

      if (betsToInsert.length > 0) {
        const { error: betsError } = await supabase.from("bets").insert(betsToInsert)

        if (betsError) throw betsError
        console.log("[v0] Created bets:", betsToInsert.length)
      }

      // Success! Clear fields except buyer for fast entry
      setNumber("")
      setTopStraight("")
      setTopPermutation("")
      setBottomStraight("")
      // setBottomPermutation("") // Removed

      // Trigger a page refresh to update tables
      window.dispatchEvent(new Event("lottery-update"))
    } catch (error) {
      console.error("[v0] Error saving bet:", error)
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + (error as Error).message)
    }
  }

  const handleClear = () => {
    setBuyer("")
    setNumber("")
    setTopStraight("")
    setTopPermutation("")
    setBottomStraight("")
    // setBottomPermutation("") // Removed
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm p-4 md:p-6 space-y-4 md:space-y-6 rounded-lg">
      {/* Input section */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
          <label className="bg-gray-600 text-white px-4 md:px-6 py-2 rounded-lg font-semibold text-sm md:text-base whitespace-nowrap">
            ผู้ซื้อ
          </label>
          <span className="text-white text-xl hidden md:inline">:</span>
          <Input
            ref={buyerRef}
            value={buyer}
            onChange={(e) => handleBuyerChange(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, numberRef)}
            className="flex-1 md:w-80 bg-white border-0 text-gray-900 text-sm md:text-base"
            style={{ colorScheme: "light" }}
            placeholder="ชื่อผู้ซื้อ"
          />
        </div>
        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
          <label className="bg-gray-600 text-white px-4 md:px-6 py-2 rounded-lg font-semibold text-sm md:text-base whitespace-nowrap">
            เลขหวย
          </label>
          <span className="text-white text-xl hidden md:inline">:</span>
          <Input
            ref={numberRef}
            value={number}
            onChange={(e) => handleNumberChange(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, topStraightRef)}
            className="flex-1 md:w-80 bg-white border-0 text-gray-900 text-sm md:text-base"
            style={{ colorScheme: "light" }}
            placeholder="2-3 หลัก"
          />
        </div>
      </div>

      {/* Grid section */}
      <div className="border-2 border-gray-500 overflow-x-auto">
        <div className="grid grid-cols-3 min-w-[300px]">
          {/* Empty top-left cell */}
          <div className="border-r-2 border-b-2 border-gray-500 bg-gray-800/30"></div>

          {/* Column headers */}
          <div className="border-r-2 border-b-2 border-gray-500 flex items-center justify-center p-2 md:p-4 bg-gray-800/30">
            <span className="bg-gray-600 text-white px-4 md:px-8 py-1.5 md:py-2 rounded-lg font-semibold text-sm md:text-lg">
              ตรง
            </span>
          </div>
          <div className="border-b-2 border-gray-500 flex items-center justify-center p-2 md:p-4 bg-gray-800/30">
            <span className="bg-gray-600 text-white px-4 md:px-8 py-1.5 md:py-2 rounded-lg font-semibold text-sm md:text-lg">
              โต๊ด
            </span>
          </div>

          {/* Row 1: บน */}
          <div className="border-r-2 border-b-2 border-gray-500 flex items-center justify-center p-2 md:p-4 bg-gray-800/30">
            <span className="bg-gray-600 text-white px-4 md:px-8 py-1.5 md:py-2 rounded-lg font-semibold text-sm md:text-lg">
              บน
            </span>
          </div>
          <div className="border-r-2 border-b-2 border-gray-500 flex items-center justify-center p-2 md:p-4 bg-gray-800/30">
            <Input
              ref={topStraightRef}
              value={topStraight}
              onChange={(e) => handleTableInputChange(e.target.value, setTopStraight)}
              onKeyDown={(e) => handleKeyDown(e, topPermutationRef)}
              className="w-20 md:w-32 text-center bg-white border-0 text-gray-900 text-sm md:text-base"
              style={{ colorScheme: "light" }}
            />
          </div>
          <div className="border-b-2 border-gray-500 flex items-center justify-center p-2 md:p-4 bg-gray-800/30">
            <Input
              ref={topPermutationRef}
              value={topPermutation}
              onChange={(e) => handleTopPermutationChange(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, bottomStraightRef)}
              className="w-20 md:w-32 text-center bg-white border-0 text-gray-900 text-sm md:text-base"
              style={{ colorScheme: "light" }}
            />
          </div>

          {/* Row 2: ล่าง */}
          <div className="border-r-2 border-gray-500 flex items-center justify-center p-2 md:p-4 bg-gray-800/30">
            <span className="bg-gray-600 text-white px-4 md:px-8 py-1.5 md:py-2 rounded-lg font-semibold text-sm md:text-lg">
              ล่าง
            </span>
          </div>
          <div className="col-span-2 flex items-center justify-center p-2 md:p-4 bg-gray-800/30">
            <Input
              ref={bottomStraightRef}
              value={bottomStraight}
              onChange={(e) => handleTableInputChange(e.target.value, setBottomStraight)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAdd()
                }
              }}
              className="w-20 md:w-32 text-center bg-white border-0 text-gray-900 text-sm md:text-base"
              style={{ colorScheme: "light" }}
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between gap-4">
        <Button
          onClick={handleClear}
          variant="destructive"
          className="bg-red-500 hover:bg-red-600 text-white px-6 md:px-12 py-2 md:py-3 rounded-lg font-semibold text-base md:text-lg"
        >
          ล้าง
        </Button>
        <Button
          onClick={handleAdd}
          className="bg-[#00d969] hover:bg-[#00c05d] text-white px-6 md:px-12 py-2 md:py-3 rounded-lg font-semibold text-base md:text-lg"
        >
          เพิ่ม
        </Button>
      </div>
    </div>
  )
}
