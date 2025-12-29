"use client"

import { useState } from "react"
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
  bottomPermutation: string
  timestamp: number
}

export function LotteryForm() {
  const [buyer, setBuyer] = useState("")
  const [number, setNumber] = useState("")
  const [topStraight, setTopStraight] = useState("")
  const [topPermutation, setTopPermutation] = useState("")
  const [bottomStraight, setBottomStraight] = useState("")
  const [bottomPermutation, setBottomPermutation] = useState("")

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

    // Check if at least one bet amount is entered
    if (!topStraight && !topPermutation && !bottomStraight && !bottomPermutation) {
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

      // 4. Create bets for each non-empty field
      const betsToInsert = []

      if (topStraight) {
        betsToInsert.push({
          order_id: orderId,
          bet_number: Number.parseInt(number),
          category: "3_top",
          bet_type: "direct",
          amount: Number.parseInt(topStraight),
        })
      }

      if (topPermutation) {
        betsToInsert.push({
          order_id: orderId,
          bet_number: Number.parseInt(number),
          category: "3_top",
          bet_type: "indirect",
          amount: Number.parseInt(topPermutation),
        })
      }

      if (bottomStraight) {
        betsToInsert.push({
          order_id: orderId,
          bet_number: Number.parseInt(number),
          category: "3_bottom",
          bet_type: "direct",
          amount: Number.parseInt(bottomStraight),
        })
      }

      if (bottomPermutation) {
        betsToInsert.push({
          order_id: orderId,
          bet_number: Number.parseInt(number),
          category: "3_bottom",
          bet_type: "indirect",
          amount: Number.parseInt(bottomPermutation),
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
      setBottomPermutation("")

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
    setBottomPermutation("")
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm p-6 space-y-6 rounded-lg">
      {/* Input section */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <label className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold text-base">ผู้ซื้อ</label>
          <span className="text-white text-xl">:</span>
          <Input
            value={buyer}
            onChange={(e) => handleBuyerChange(e.target.value)}
            className="w-80 bg-[#e8ecf0] border-0 text-gray-900 text-base"
            placeholder="ชื่อผู้ซื้อ"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold text-base">เลขหวย</label>
          <span className="text-white text-xl">:</span>
          <Input
            value={number}
            onChange={(e) => handleNumberChange(e.target.value)}
            className="w-80 bg-[#e8ecf0] border-0 text-gray-900 text-base"
            placeholder="2-3 หลัก"
          />
        </div>
      </div>

      {/* Grid section */}
      <div className="border-2 border-gray-500">
        <div className="grid grid-cols-3">
          {/* Empty top-left cell */}
          <div className="border-r-2 border-b-2 border-gray-500 bg-gray-800/30"></div>

          {/* Column headers */}
          <div className="border-r-2 border-b-2 border-gray-500 flex items-center justify-center p-4 bg-gray-800/30">
            <span className="bg-gray-600 text-white px-8 py-2 rounded-lg font-semibold text-lg">ตรง</span>
          </div>
          <div className="border-b-2 border-gray-500 flex items-center justify-center p-4 bg-gray-800/30">
            <span className="bg-gray-600 text-white px-8 py-2 rounded-lg font-semibold text-lg">โต๊ด</span>
          </div>

          {/* Row 1: บน */}
          <div className="border-r-2 border-b-2 border-gray-500 flex items-center justify-center p-4 bg-gray-800/30">
            <span className="bg-gray-600 text-white px-8 py-2 rounded-lg font-semibold text-lg">บน</span>
          </div>
          <div className="border-r-2 border-b-2 border-gray-500 flex items-center justify-center p-4 bg-gray-800/30">
            <Input
              value={topStraight}
              onChange={(e) => handleTableInputChange(e.target.value, setTopStraight)}
              className="w-32 text-center bg-[#e8ecf0] border-0 text-gray-900"
            />
          </div>
          <div className="border-b-2 border-gray-500 flex items-center justify-center p-4 bg-gray-800/30">
            <Input
              value={topPermutation}
              onChange={(e) => handleTableInputChange(e.target.value, setTopPermutation)}
              className="w-32 text-center bg-[#e8ecf0] border-0 text-gray-900"
            />
          </div>

          {/* Row 2: ล่าง */}
          <div className="border-r-2 border-gray-500 flex items-center justify-center p-4 bg-gray-800/30">
            <span className="bg-gray-600 text-white px-8 py-2 rounded-lg font-semibold text-lg">ล่าง</span>
          </div>
          <div className="border-r-2 border-gray-500 flex items-center justify-center p-4 bg-gray-800/30">
            <Input
              value={bottomStraight}
              onChange={(e) => handleTableInputChange(e.target.value, setBottomStraight)}
              className="w-32 text-center bg-[#e8ecf0] border-0 text-gray-900"
            />
          </div>
          <div className="flex items-center justify-center p-4 bg-gray-800/30">
            <Input
              value={bottomPermutation}
              onChange={(e) => handleTableInputChange(e.target.value, setBottomPermutation)}
              className="w-32 text-center bg-[#e8ecf0] border-0 text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between">
        <Button
          onClick={handleClear}
          variant="destructive"
          className="bg-red-500 hover:bg-red-600 text-white px-12 py-3 rounded-lg font-semibold text-lg"
        >
          ล้าง
        </Button>
        <Button
          onClick={handleAdd}
          className="bg-[#00d969] hover:bg-[#00c05d] text-white px-12 py-3 rounded-lg font-semibold text-lg"
        >
          เพิ่ม
        </Button>
      </div>
    </div>
  )
}
