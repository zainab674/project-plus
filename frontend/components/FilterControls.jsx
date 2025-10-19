'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Calendar, 
  ChevronDown, 
  X, 
  Filter,
  RotateCcw
} from 'lucide-react';
import { useDashboardFilter } from '@/providers/DashboardFilterProvider';
import CalendarSelector from './CalendarSelector';

const CasesDropdown = () => {
  const { 
    projects, 
    selectedCase, 
    setSelectedCase, 
    isLoading,
    activeCasesCount,
    filteredCasesCount 
  } = useDashboardFilter();

  // Filter only active projects for the dropdown
  const activeProjects = React.useMemo(() => {
    return projects.filter(project => project.status === 'Active');
  }, [projects]);

  const handleCaseSelect = (project) => {
    setSelectedCase(project);
  };

  const handleClearSelection = () => {
    setSelectedCase(null);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="h-9 px-3 text-sm font-medium bg-white border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        >
          <Briefcase className="h-4 w-4 mr-2 text-gray-600" />
          <span className="truncate max-w-[120px]">
            {selectedCase ? selectedCase.name : "All Cases"}
          </span>
          <ChevronDown className="h-4 w-4 ml-2 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 shadow-lg"
        align="start"
      >
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Filter by Case</h4>
            {selectedCase && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {activeCasesCount} active cases available
          </p>
        </div>

        <DropdownMenuItem 
          onClick={handleClearSelection}
          className={`px-3 py-2 cursor-pointer ${
            !selectedCase 
              ? 'bg-blue-50 text-blue-700 font-medium' 
              : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span>All Cases</span>
            <Badge variant="secondary" className="text-xs">
              {activeCasesCount}
            </Badge>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {activeProjects.length === 0 ? (
          <div className="px-3 py-4 text-center text-gray-500 text-sm">
            No active cases found
          </div>
        ) : (
          activeProjects.map((project) => (
            <DropdownMenuItem
              key={project.project_id}
              onClick={() => handleCaseSelect(project)}
              className={`px-3 py-2 cursor-pointer ${
                selectedCase?.project_id === project.project_id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col w-full">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{project.name}</span>
                  <Badge 
                    variant={project.priority === 'High' ? 'destructive' : 
                           project.priority === 'Medium' ? 'default' : 'secondary'}
                    className="text-xs ml-2"
                  >
                    {project.priority}
                  </Badge>
                </div>
                <span className="text-xs text-gray-500 truncate mt-1">
                  {project.client_name} • ID: {project.project_id}
                </span>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const MonthYearSelector = () => {
  const { 
    availableMonths, 
    selectedMonthYear, 
    setSelectedMonthYear, 
    isLoading 
  } = useDashboardFilter();

  const handleMonthSelect = (monthYear) => {
    setSelectedMonthYear(monthYear);
  };

  const handleClearSelection = () => {
    setSelectedMonthYear(null);
  };

  return (
    <CalendarSelector
      selectedMonthYear={selectedMonthYear}
      onSelect={handleMonthSelect}
      onClear={handleClearSelection}
      isLoading={isLoading}
      availableMonths={availableMonths}
    />
  );
};

const FilterControls = () => {
  const { 
    hasActiveFilters, 
    resetFilters, 
    isLoading,
    filteredCasesCount,
    activeCasesCount
  } = useDashboardFilter();

  return (
    <div className="flex items-center space-x-3">
      {/* Cases Dropdown */}
      <CasesDropdown />
      
      {/* Month-Year Calendar Selector */}
      <MonthYearSelector />
      
      {/* Reset Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
          className="h-9 px-3 text-sm text-gray-600 hover:text-gray-800 border-gray-300"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      )}
    </div>
  );
};

export default FilterControls;
