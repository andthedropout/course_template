"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DateTimePickerProps {
  value?: string // ISO string or datetime-local format
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  disabled = false
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse the value into date and time
  const dateValue = value ? new Date(value) : undefined
  const timeValue = value
    ? format(new Date(value), "HH:mm")
    : "09:00"

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange("")
      return
    }

    // Combine date with current time
    const [hours, minutes] = timeValue.split(":")
    date.setHours(parseInt(hours), parseInt(minutes))

    // Convert to datetime-local format (YYYY-MM-DDTHH:mm)
    onChange(format(date, "yyyy-MM-dd'T'HH:mm"))
    setOpen(false)
  }

  const handleTimeChange = (time: string) => {
    if (!dateValue) return

    const [hours, minutes] = time.split(":")
    const newDate = new Date(dateValue)
    newDate.setHours(parseInt(hours), parseInt(minutes))

    onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"))
  }

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex-1 justify-start text-left font-normal",
              !dateValue && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateValue ? format(dateValue, "PPP") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Input
        type="time"
        value={timeValue}
        onChange={(e) => handleTimeChange(e.target.value)}
        className="w-32"
        disabled={disabled || !dateValue}
      />
    </div>
  )
}
