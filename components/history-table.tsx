"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function HistoryTable() {
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <h2 className="bg-gray-600 text-white text-xl font-semibold py-3 px-12 rounded-lg">สรุปยอดซื้อรวมต่อเลข</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder=""
          className="bg-gray-600 border-0 pl-12 py-6 rounded-lg text-base text-white placeholder:text-gray-400"
        />
      </div>

      <div className="border-2 border-gray-500 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-700 hover:bg-gray-700 border-b-2 border-gray-500">
              <TableHead className="text-center text-white font-semibold text-base border-r-2 border-gray-500">
                เลขหวย
              </TableHead>
              <TableHead className="text-center text-white font-semibold text-base border-r-2 border-gray-500">
                ประเภท
              </TableHead>
              <TableHead className="text-center text-white font-semibold text-base border-r-2 border-gray-500">
                ยอดซื้อตรง
              </TableHead>
              <TableHead className="text-center text-white font-semibold text-base border-r-2 border-gray-500">
                ยอดซื้อโต๊ด
              </TableHead>
              <TableHead className="text-center text-white font-semibold text-base">ยอดซื้อรวม</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="h-[400px] text-center text-gray-400 bg-gray-800/50"></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-center items-center gap-8">
        <Button className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold text-base">
          ก่อนหน้า
        </Button>
        <span className="text-white font-normal text-lg">หน้า 1 จาก 10</span>
        <Button className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold text-base">
          ถัดไป
        </Button>
      </div>
    </div>
  )
}
