import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { getUpcomingSundays } from "../../lib/date-utils";

export function WeekSelector({ selectedWeek, onWeekChange, customWeeks }) {
  const [allSundays, setAllSundays] = useState([]);
  const today = new Date();

  // Initialise displayed month/year from the selected week (which may be in the next month)
  const initDate = selectedWeek ? new Date(selectedWeek + 'T00:00:00') : today;
  const [currentMonth, setCurrentMonth] = useState(initDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initDate.getFullYear());

  // console.log('WeekSelector initialized with month:', currentMonth, 'year:', currentYear);

  // Generate comprehensive Sunday list using existing date-utils and extending it
  const generateComprehensiveSundays = () => {
    const allSundays = [];
    const today = new Date();
    
    // Generate Sundays for the entire year - past and future
    const startOfYear = new Date(today.getFullYear(), 0, 1); // Jan 1st of current year
    const endOfNextYear = new Date(today.getFullYear() + 1, 11, 31); // Dec 31st of next year
    
    // Find first Sunday of the current year
    let currentDate = new Date(startOfYear);
    while (currentDate.getDay() !== 0) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Generate all Sundays from first Sunday of year to end of next year
    while (currentDate <= endOfNextYear) {
      // Format date as YYYY-MM-DD without timezone conversion
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      const timeDiff = currentDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      let status;
      if (daysDiff < 0) status = "past";
      else if (daysDiff === 0) status = "today";
      else if (daysDiff <= 7) status = "active";
      else status = "upcoming";
      
      allSundays.push({
        date: new Date(currentDate),
        dateString,
        title: currentDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        status,
        daysUntil: daysDiff
      });
      
      // Move to next Sunday
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return allSundays;
  };

  // Initialize all Sundays
  useEffect(() => {
    // console.log('useEffect called with customWeeks:', customWeeks);
    
    if (customWeeks && customWeeks.length > 0) {
      // console.log('Using custom weeks:', customWeeks.length);
      setAllSundays(customWeeks);
    } else {
      // console.log('Generating comprehensive Sundays...');
      const comprehensiveSundays = generateComprehensiveSundays();
      
      // console.log('Total Generated Sundays:', comprehensiveSundays.length);
      // console.log('First 5 Sundays:', comprehensiveSundays.slice(0, 5).map(s => s.dateString));
      // console.log('Last 5 Sundays:', comprehensiveSundays.slice(-5).map(s => s.dateString));
      
      // Debug: Show what months we actually generated
      const monthCounts = {};
      comprehensiveSundays.forEach(sunday => {
        const date = new Date(sunday.dateString + 'T00:00:00');
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      });
      // console.log('Sundays by month:', monthCounts);
      
      setAllSundays(comprehensiveSundays);
    }
  }, [customWeeks]);

  // Sync displayed month/year when selectedWeek changes to a different month
  useEffect(() => {
    if (!selectedWeek) return;
    const d = new Date(selectedWeek + 'T00:00:00');
    setCurrentMonth(d.getMonth());
    setCurrentYear(d.getFullYear());
  }, [selectedWeek]);

  // Auto-select today's or next Sunday if no selection
  useEffect(() => {
    if (allSundays.length > 0 && !selectedWeek) {
      const todayOrNext = allSundays.find(
        (sunday) => sunday.status === "today" || sunday.status === "active"
      ) || allSundays.find(sunday => sunday.status === "upcoming");
      
      if (todayOrNext) {
        onWeekChange(todayOrNext.dateString);
      }
    }
  }, [allSundays, selectedWeek, onWeekChange]);

  // Get Sundays for current displayed month
  const getCurrentMonthSundays = () => {
    const filtered = allSundays.filter(sunday => {
      const date = new Date(sunday.dateString + 'T00:00:00'); // Add time to avoid timezone issues
      const sundayMonth = date.getMonth();
      const sundayYear = date.getFullYear();
      
      return sundayMonth === currentMonth && sundayYear === currentYear;
    });
    
    // console.log(`Current month: ${currentMonth}, year: ${currentYear}`);
    // console.log('All Sundays:', allSundays.length);
    // console.log('Sample all Sundays:', allSundays.slice(0, 3).map(s => ({
    //   dateString: s.dateString,
    //   month: new Date(s.dateString + 'T00:00:00').getMonth(),
    //   year: new Date(s.dateString + 'T00:00:00').getFullYear()
    // })));
    // console.log('ALL Sunday dates:', allSundays.map(s => s.dateString));
    // console.log('Filtered Sundays for current month:', filtered.length);
    // console.log('Sample filtered:', filtered.slice(0, 3));
    
    return filtered;
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Format functions
  const formatShortDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getDaysUntilText = (daysUntil) => {
    if (daysUntil === 0) return "Today";
    if (daysUntil === 1) return "Tomorrow";
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days ago`;
    return `in ${daysUntil} days`;
  };

  const getMonthYearText = () => {
    const date = new Date(currentYear, currentMonth);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const currentMonthSundays = getCurrentMonthSundays();

  if (allSundays.length === 0) {
    return (
      <Card className="relative z-20 rounded-xl">
        <CardContent className="p-3 md:p-4 flex items-center justify-center">
          <div className="text-sm text-gray-600">Loading Sundays...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative z-20 rounded-xl">
      <CardContent className="p-3 md:p-4">
        {/* Desktop View */}
        <div className="hidden md:block">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="border-gray-400 text-gray-700 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous Month
            </Button>
            
            <h3 className="text-lg font-semibold text-gray-900">
              {getMonthYearText()}
            </h3>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="border-gray-400 text-gray-700 hover:bg-gray-100"
            >
              Next Month
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Sundays Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {currentMonthSundays.map((sunday) => {
              const isSelected = selectedWeek === sunday.dateString;
              const isToday = sunday.status === "today";
              const isPast = sunday.status === "past";
              
              return (
                <Button
                  key={sunday.dateString}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onWeekChange(sunday.dateString)}
                  className={`flex flex-col items-center gap-1 h-auto py-3 transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-700 shadow-md"
                      : isPast
                      ? "border-gray-300 text-gray-500 hover:bg-gray-50"
                      : "border-blue-300 text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  <Calendar className={`w-4 h-4 ${isSelected ? "text-white" : "text-gray-600"}`} />
                  <div className="text-center">
                    <div className="text-sm font-medium flex items-center gap-1">
                      {formatShortDate(sunday.dateString)}
                      {isToday && (
                        <span className="bg-green-500 w-2 h-2 rounded-full"></span>
                      )}
                    </div>
                    <div className="text-xs opacity-80">
                      {getDaysUntilText(sunday.daysUntil)}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>

          {currentMonthSundays.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No Sundays in this month
            </div>
          )}
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          {/* Month Navigation Header */}
          <div className="flex items-center justify-between mb-4 px-1">
            <Button
              variant="outline"
              size="lg"
              onClick={goToPreviousMonth}
              className="h-12 w-12 p-0 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {getMonthYearText()}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Select a Sunday</p>
            </div>
            
            <Button
              variant="outline"
              size="lg"
              onClick={goToNextMonth}
              className="h-12 w-12 p-0 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Sundays List */}
          <div className="space-y-2">
            {currentMonthSundays.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No Sundays in this month</p>
              </div>
            ) : (
              currentMonthSundays.map((sunday) => {
                const isSelected = selectedWeek === sunday.dateString;
                const isToday = sunday.status === "today";
                const isPast = sunday.status === "past";
                
                return (
                  <div
                    key={sunday.dateString}
                    onClick={() => onWeekChange(sunday.dateString)}
                    className={`
                      p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 active:scale-98
                      ${isSelected 
                        ? "bg-blue-50 border-blue-300 shadow-md" 
                        : isPast
                        ? "bg-gray-50 border-gray-200"
                        : "bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          ${isSelected 
                            ? "bg-blue-600 text-white" 
                            : isPast
                            ? "bg-gray-200 text-gray-500"
                            : "bg-blue-100 text-blue-600"
                          }
                        `}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`
                              text-base font-semibold 
                              ${isSelected 
                                ? "text-blue-900" 
                                : isPast
                                ? "text-gray-500"
                                : "text-gray-900"
                              }
                            `}>
                              {sunday.date.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric"
                              })}
                            </span>
                            {isToday && (
                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                Today
                              </span>
                            )}
                          </div>
                          <p className={`
                            text-sm 
                            ${isSelected 
                              ? "text-blue-700" 
                              : isPast
                              ? "text-gray-400"
                              : "text-gray-600"
                            }
                          `}>
                            Sunday Service
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`
                          text-sm font-medium 
                          ${isSelected 
                            ? "text-blue-800" 
                            : isPast
                            ? "text-gray-400"
                            : "text-gray-600"
                          }
                        `}>
                          {getDaysUntilText(sunday.daysUntil)}
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-1 ml-auto"></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
