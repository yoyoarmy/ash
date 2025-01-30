'use client'
import React from 'react'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const renderCalendarDays = () => {
    const days: React.ReactNode[] = []
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(
        <div key={i} className="p-2 border hover:bg-gray-100 cursor-pointer">
          <span className="text-sm">{i}</span>
          {/* Add event indicators or reservation status here */}
        </div>
      )
    }
    return days
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-semibold">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded">
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 bg-gray-100 text-center font-semibold">
            {day}
          </div>
        ))}
        {renderCalendarDays()}
      </div>
    </div>
  )
}

export default Calendar

