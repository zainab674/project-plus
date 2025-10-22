'use client';

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Check
} from 'lucide-react';
import dayjs from 'dayjs';

const CalendarSelector = ({ 
  selectedMonthYear, 
  onSelect, 
  onClear, 
  isLoading = false,
  availableMonths = [],
  className = "",
  isRange = false,
  selectedMonthRange = null,
  onRangeSelect = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(dayjs().year());
  const [currentMonth, setCurrentMonth] = useState(dayjs().month());
  const [tempRange, setTempRange] = useState({ from: null, to: null });

  // Generate months for the current year
  const monthsInYear = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const month = dayjs().year(currentYear).month(i);
      const monthYear = month.format('MMMM YYYY');
      const isAvailable = availableMonths.includes(monthYear);
      
      let isSelected = false;
      let isInRange = false;
      let isRangeStart = false;
      let isRangeEnd = false;
      
      if (isRange && selectedMonthRange) {
        const monthDate = dayjs(monthYear, 'MMMM YYYY');
        const fromDate = dayjs(selectedMonthRange.from, 'MMMM YYYY');
        const toDate = dayjs(selectedMonthRange.to, 'MMMM YYYY');
        
        isSelected = monthYear === selectedMonthRange.from || monthYear === selectedMonthRange.to;
        isInRange = monthDate.isBetween(fromDate, toDate, 'month', '[]');
        isRangeStart = monthYear === selectedMonthRange.from;
        isRangeEnd = monthYear === selectedMonthRange.to;
      } else if (!isRange) {
        isSelected = selectedMonthYear === monthYear;
      }
      
      months.push({
        month: i,
        name: month.format('MMMM'),
        shortName: month.format('MMM'),
        monthYear,
        isAvailable,
        isSelected,
        isInRange,
        isRangeStart,
        isRangeEnd
      });
    }
    return months;
  }, [currentYear, availableMonths, selectedMonthYear, isRange, selectedMonthRange]);

  // Generate years (current year ± 5 years)
  const availableYears = useMemo(() => {
    const years = [];
    const currentYearNum = dayjs().year();
    for (let i = currentYearNum - 5; i <= currentYearNum + 5; i++) {
      years.push(i);
    }
    return years;
  }, []);

  const handleMonthSelect = (monthData) => {
    if (!monthData.isAvailable) return;
    
    if (isRange && onRangeSelect) {
      // Handle range selection
      if (!tempRange.from) {
        // First selection - set from date
        setTempRange({ from: monthData.monthYear, to: null });
      } else if (!tempRange.to) {
        // Second selection - set to date
        const fromDate = dayjs(tempRange.from, 'MMMM YYYY');
        const toDate = dayjs(monthData.monthYear, 'MMMM YYYY');
        
        // Ensure from is before to
        if (fromDate.isAfter(toDate)) {
          setTempRange({ from: monthData.monthYear, to: tempRange.from });
        } else {
          setTempRange({ from: tempRange.from, to: monthData.monthYear });
        }
        
        // Apply the range selection
        onRangeSelect({
          from: fromDate.isAfter(toDate) ? monthData.monthYear : tempRange.from,
          to: fromDate.isAfter(toDate) ? tempRange.from : monthData.monthYear
        });
        setIsOpen(false);
      } else {
        // Reset and start new selection
        setTempRange({ from: monthData.monthYear, to: null });
      }
    } else {
      // Handle single month selection
      onSelect(monthData.monthYear);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    if (isRange) {
      setTempRange({ from: null, to: null });
    }
    onClear();
    setIsOpen(false);
  };

  const handleYearChange = (year) => {
    setCurrentYear(year);
  };

  const handlePrevYear = () => {
    setCurrentYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setCurrentYear(prev => prev + 1);
  };

  const getDisplayText = () => {
    if (isRange && selectedMonthRange) {
      return `${selectedMonthRange.from} - ${selectedMonthRange.to}`;
    } else if (selectedMonthYear) {
      return selectedMonthYear;
    }
    return "All Time";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={`h-9 px-3 text-sm font-medium bg-white border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
          disabled={isLoading}
        >
          <Calendar className="h-4 w-4 mr-2 text-gray-600" />
          <span className="truncate max-w-[120px]">
            {getDisplayText()}
          </span>
          <ChevronRight className="h-4 w-4 ml-2 text-gray-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-white border border-gray-200 shadow-lg"
        align="start"
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-900">
              {isRange ? "Select Month Range" : "Select Month & Year"}
            </h4>
            <div className="flex items-center gap-2">
              {(selectedMonthYear || (isRange && selectedMonthRange)) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevYear}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <select
                value={currentYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="text-sm font-medium bg-transparent border-none outline-none cursor-pointer"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextYear}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {monthsInYear.map((monthData) => (
              <Button
                key={monthData.month}
                variant={monthData.isSelected ? "default" : "ghost"}
                size="sm"
                onClick={() => handleMonthSelect(monthData)}
                disabled={!monthData.isAvailable}
                className={`h-10 text-xs font-medium ${
                  monthData.isSelected 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : monthData.isInRange && isRange
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : monthData.isAvailable
                        ? 'hover:bg-gray-100 text-gray-700'
                        : 'text-gray-400 cursor-not-allowed opacity-50'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span>{monthData.shortName}</span>
                  {monthData.isSelected && (
                    <Check className="h-3 w-3 mt-1" />
                  )}
                  {isRange && monthData.isRangeStart && (
                    <span className="text-xs mt-1">From</span>
                  )}
                  {isRange && monthData.isRangeEnd && (
                    <span className="text-xs mt-1">To</span>
                  )}
                </div>
              </Button>
            ))}
          </div>

          {/* Range Selection Instructions */}
          {isRange && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                {!tempRange.from 
                  ? "Select the starting month for your range"
                  : !tempRange.to 
                    ? "Now select the ending month for your range"
                    : "Range selected! Click any month to start a new range."
                }
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                All Time
              </Button>
              <div className="text-xs text-gray-500">
                {availableMonths.length} months available
              </div>
            </div>
          </div>

          {/* Available Months List */}
          {availableMonths.length > 0 && (
            <div className="border-t pt-3 mt-3">
              <h5 className="text-xs font-medium text-gray-700 mb-2">Available Months</h5>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {availableMonths.slice(0, 10).map((monthYear) => (
                  <Button
                    key={monthYear}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onSelect(monthYear);
                      setIsOpen(false);
                    }}
                    className={`w-full justify-start h-8 text-xs ${
                      selectedMonthYear === monthYear
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Calendar className="h-3 w-3 mr-2" />
                    {monthYear}
                    {selectedMonthYear === monthYear && (
                      <Check className="h-3 w-3 ml-auto" />
                    )}
                  </Button>
                ))}
                {availableMonths.length > 10 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    +{availableMonths.length - 10} more months
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CalendarSelector;
