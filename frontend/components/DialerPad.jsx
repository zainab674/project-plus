"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Phone, Delete } from "lucide-react"

export function DialerPad({phoneNumber,setPhoneNumber,handleCall}) {
  const longPressTimerRef = useRef(null)
  const isLongPressRef = useRef(false)

  const handleNumberClick = (num) => {
    // Only add the number if it wasn't a long press on 0
    if (!(num === "0" && isLongPressRef.current)) {
      setPhoneNumber((prev) => prev + num)
    }
    // Reset the long press flag
    isLongPressRef.current = false
  }

  const handleDelete = () => {
    setPhoneNumber((prev) => prev.slice(0, -1))
  }

 

  const handleLongPressStart = (num) => {
    if (num === 0) {
      // Clear any existing timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }

      // Set a new timer
      longPressTimerRef.current = setTimeout(() => {
        setPhoneNumber((prev) => prev + "+")
        isLongPressRef.current = true
        longPressTimerRef.current = null
      }, 500)
    }
  }

  const handleLongPressEnd = () => {
    // Clear the timer if it exists
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  return (
    <div className="p-4">
      <Input
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        className="text-2xl text-center mb-4 h-14"
        placeholder="Enter phone number"
      />

      <div className="grid grid-cols-3 gap-4 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map((num) => (
          <Button
            key={num}
            variant="outline"
            className="h-16 text-xl font-medium bg-gray-700 text-white"
            onClick={() => handleNumberClick(num.toString())}
            onPointerDown={() => handleLongPressStart(num)}
            onPointerUp={handleLongPressEnd}
            onPointerLeave={handleLongPressEnd}
          >
            {num}
            {num === 0 && <span className="text-xs block">+</span>}
          </Button>
        ))}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          size="icon"
          className="h-16 w-16"
          onClick={handleDelete}
          disabled={phoneNumber.length === 0}
        >
          <Delete className="h-6 w-6" />
        </Button>

        <Button
          className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600"
          onClick={handleCall}
          disabled={phoneNumber.length === 0}
        >
          <Phone className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}

