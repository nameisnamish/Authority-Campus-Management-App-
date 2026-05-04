/**
 * Calendar Helper Utilities
 * Transforms attendance API calendar data into renderable week structures
 */

/**
 * Transforms calendar data from Student Attendance Report API into week-based structure
 * @param {Object} calendarData - Calendar object from API response (keyed by YYYY-MM-DD)
 * @param {number} month - Month (0-11)
 * @param {number} year - Year (e.g., 2024)
 * @returns {Array} - Array of weeks, each week is an array of 7 day objects
 * 
 * Each day object contains:
 * - day: number (1-31) or null for padding
 * - status: 'present' | 'absent' | 'leave' | 'none' | 'empty'
 * - dateStr: 'YYYY-MM-DD' or null
 * - dayData: full day object from API or null
 * 
 * @example
 * const weeks = generateCalendarWeeks(apiCalendarData, 9, 2023);
 * // Returns: [
 * //   [{day: null, ...}, {day: null, ...}, ..., {day: 1, status: 'present', ...}],
 * //   [{day: 2, status: 'absent', ...}, ..., {day: 8, status: 'present', ...}],
 * //   ...
 * // ]
 */
export const generateCalendarWeeks = (calendarData, month, year) => {
  if (!calendarData || typeof calendarData !== 'object') {
    return [];
  }

  const weeks = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  let week = [];

  // Add empty days for the first week (Sunday = 0, Monday = 1, etc.)
  for (let i = 0; i < firstDay; i++) {
    week.push({
      day: null,
      status: 'empty',
      dateStr: null,
      dayData: null,
    });
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = calendarData[dateStr];
    
    // Determine status from API data
    const status = determineStatus(dayData);

    week.push({
      day,
      status,
      dateStr,
      dayData,
    });

    // Push week when it has 7 days
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  // Fill remaining days of the last week with padding
  if (week.length > 0) {
    while (week.length < 7) {
      week.push({
        day: null,
        status: 'empty',
        dateStr: null,
        dayData: null,
      });
    }
    weeks.push(week);
  }

  return weeks;
};

/**
 * Determines attendance status from API day data
 * @param {Object} dayData - Day object from calendar API response
 * @returns {string} - 'present' | 'absent' | 'leave' | 'none' | 'empty'
 */
export const determineStatus = (dayData) => {
  if (!dayData) return 'none';

  const status = dayData.status?.toLowerCase();

  switch (status) {
    case 'present':
      return 'present';
    case 'absent':
      return 'absent';
    case 'leave':
      return 'leave';
    default:
      return 'none';
  }
};

/**
 * Gets display properties for a calendar status
 * @param {string} status - Status value ('present' | 'absent' | 'leave' | 'none' | 'empty')
 * @param {boolean} isSelected - Whether the cell is selected
 * @param {Object} colors - Theme colors object
 * @returns {Object} - Object with cellStyle and textStyle properties
 */
export const getStatusStyles = (status, isSelected, colors) => {
  const baseCell = {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  };

  const baseText = {
    fontSize: 14,
    fontWeight: '600',
  };

  switch (status) {
    case 'present':
      return {
        cellStyle: {
          ...baseCell,
          borderColor: colors.primaryGreen,
          backgroundColor: isSelected ? 'rgba(84, 219, 115, 0.1)' : 'transparent',
        },
        textStyle: {
          ...baseText,
          color: colors.primaryGreen,
        },
      };

    case 'absent':
      return {
        cellStyle: {
          ...baseCell,
          borderColor: '#AF391E',
          backgroundColor: isSelected ? 'rgba(175, 57, 30, 0.2)' : 'transparent',
        },
        textStyle: {
          ...baseText,
          color: '#FF7050',
        },
      };

    case 'leave':
      return {
        cellStyle: {
          ...baseCell,
          borderColor: colors.primaryPeach || '#FFB8A6',
          backgroundColor: isSelected ? 'rgba(255, 112, 80, 0.1)' : 'transparent',
        },
        textStyle: {
          ...baseText,
          color: colors.primaryPeach || '#FFB8A6',
        },
      };

    case 'empty':
      return {
        cellStyle: {
          ...baseCell,
          borderColor: 'transparent',
          backgroundColor: 'transparent',
        },
        textStyle: {
          ...baseText,
          color: '#333333',
        },
      };

    default: // 'none'
      return {
        cellStyle: {
          ...baseCell,
          borderColor: 'transparent',
          backgroundColor: 'transparent',
        },
        textStyle: {
          ...baseText,
          color: '#999999',
        },
      };
  }
};

/**
 * Gets the month name
 * @param {number} month - Month index (0-11)
 * @returns {string} - Full month name
 */
export const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month] || '';
};

/**
 * Formats a date string (YYYY-MM-DD) to readable format
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {Object} options - Format options
 * @returns {string} - Formatted date
 * 
 * @example
 * formatDate('2024-10-25') // 'October 25, 2024'
 * formatDate('2024-10-25', { short: true }) // 'Oct 25'
 */
export const formatDate = (dateStr, options = {}) => {
  if (!dateStr) return '';

  const [year, month, day] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  if (options.short) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

/**
 * Gets day name from date string
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} - Day name (e.g., 'Monday')
 * 
 * @example
 * getDayName('2024-10-25') // 'Friday'
 */
export const getDayName = (dateStr) => {
  if (!dateStr) return '';

  const [year, month, day] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

/**
 * Calculates attendance statistics from calendar data
 * @param {Object} calendarData - Calendar object from API
 * @returns {Object} - Object with count statistics
 * 
 * @example
 * const stats = calculateAttendanceStats(apiCalendarData);
 * // { present: 15, absent: 3, leave: 1, total: 19 }
 */
export const calculateAttendanceStats = (calendarData) => {
  if (!calendarData) {
    return { present: 0, absent: 0, leave: 0, total: 0 };
  }

  let present = 0;
  let absent = 0;
  let leave = 0;

  Object.values(calendarData).forEach(dayData => {
    if (!dayData) return;

    const status = dayData.status?.toLowerCase();
    switch (status) {
      case 'present':
        present++;
        break;
      case 'absent':
        absent++;
        break;
      case 'leave':
        leave++;
        break;
      default:
        break;
    }
  });

  const total = present + absent + leave;

  return {
    present,
    absent,
    leave,
    total,
  };
};
