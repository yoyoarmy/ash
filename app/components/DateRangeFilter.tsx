'use client';

import { useState } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { es } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface DateRangeFilterProps {
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function DateRangeFilter({ onDateRangeChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(new Date().getFullYear(), 11, 31)
  });

  const handleRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    onDateRangeChange(range);
  };

  const handleResetClick = () => {
    const range = {
      from: new Date(),
      to: new Date(new Date().getFullYear(), 11, 31)
    };
    setDateRange(range);
    onDateRangeChange(range);
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="bg-white w-[240px] justify-start text-left font-normal"
      >
        <Calendar className="mr-2 h-4 w-4" />
        {dateRange?.from ? (
          dateRange.to ? (
            <>
              {format(dateRange.from, 'd MMM', { locale: es })} -{' '}
              {format(dateRange.to, 'd MMM, yyyy', { locale: es })}
            </>
          ) : (
            format(dateRange.from, 'd MMM, yyyy', { locale: es })
          )
        ) : (
          <span>Seleccionar fechas</span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 bg-white rounded-lg shadow-lg p-4 z-50">
          <DayPicker
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleRangeSelect}
            numberOfMonths={2}
            locale={es}
            formatters={{
              formatCaption: (date) => {
                return format(date, 'MMMM yyyy', { locale: es })
                  .replace(/^\w/, (c) => c.toUpperCase());
              },
              formatWeekdayName: (date) => {
                return format(date, 'EEEEEE', { locale: es }).toUpperCase();
              }
            }}
            components={{
              IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" {...props} />,
              IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" {...props} />
            }}
            modifiers={{
              range: dateRange,
            }}
            modifiersStyles={{
              range_start: { 
                color: 'white',
                backgroundColor: '#3b82f6'
              },
              range_end: { 
                color: 'white',
                backgroundColor: '#3b82f6'
              },
              range_middle: { 
                color: '#1e3a8a',
                backgroundColor: '#eff6ff'
              }
            }}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button
              className="bg-white hover:bg-gray-50 border border-gray-200"
              onClick={handleResetClick}
            >
              Reiniciar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setIsOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 