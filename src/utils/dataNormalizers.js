/**
 * Data Normalizers - Transform API responses into unified cache format
 * Handles different field naming conventions from different endpoints
 */

/**
 * Normalize /api/teacher/profile response to standard format
 * @param {object} apiResponse - Raw API response
 * @returns {object} - Normalized profile data
 */
export const normalizeProfileData = (apiResponse) => {
  if (!apiResponse?.data) {
    console.warn('normalizeProfileData: Invalid response structure');
    return null;
  }

  const { data } = apiResponse;

  return {
    // Identity info
    id: data.id,
    employeeId: data.employeeId,
    firstName: data.firstName,
    lastName: data.lastName,
    fullName: `${data.firstName} ${data.lastName}`,
    title: data.title || '',
    profileImage: data.profileImage,
    
    // Professional info
    designation: data.designation,
    department: data.department,
    collegeEmail: data.collegeEmail,
    college: data.college,
    
    // Location info
    location: {
      block: data.location?.block || '',
      displayText: data.location?.displayText || '',
      room: data.location?.displayText || ''
    },
    
    // Cabin info
    cabin: {
      number: data.cabin?.number || '',
      displayText: data.cabin?.displayText || ''
    },
    
    // Office hours
    officeHours: {
      schedule: data.officeHours?.schedule || [],
      displayText: data.officeHours?.displayText || 'Not available'
    },
    
    // Status/preferences
    status: {
      isInOffice: data.status?.isInOffice || false,
      isDarkThemeEnabled: data.status?.isDarkThemeEnabled || true,
      currentStatus: data.status?.currentStatus || 'INACTIVE'
    }
  };
};

/**
 * Normalize /api/teacher/dashboard response to standard format
 * Extracts only today's schedule (not the profile snapshot)
 * @param {object} apiResponse - Raw API response
 * @returns {object} - Normalized today's schedule
 */
export const normalizeTodayScheduleData = (apiResponse) => {
  if (!apiResponse?.todaySchedule) {
    console.warn('normalizeTodayScheduleData: Invalid response structure');
    return null;
  }

  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

  return {
    schedule: apiResponse.todaySchedule || [], // Array of today's classes
    meta: {
      day: apiResponse.meta?.day || dayName,
      totalClassesToday: apiResponse.meta?.totalClassesToday || 0,
      fetchedAt: Date.now()
    }
  };
};

/**
 * Normalize /api/teacher/schedule response to standard format
 * Extracts assignments and weekly schedule separately
 * Handles nested classroom structure and field variations
 * @param {object} apiResponse - Raw API response
 * @returns {object} - Contains both assignments and weeklySchedule
 */
export const normalizeScheduleData = (apiResponse) => {
  if (!apiResponse?.data) {
    console.warn('normalizeScheduleData: Invalid response structure');
    return null;
  }

  const { data } = apiResponse;

  // Normalize assignments array to ensure consistent field structure
  const normalizedAssignments = (data.assignments || []).map(assignment => ({
    assignmentId: assignment.assignmentId,
    subject: {
      subject_id: assignment.subject?.subject_id,
      subject_code: assignment.subject?.subject_code,
      subject_name: assignment.subject?.subject_name,
      subject_type: assignment.subject?.subject_type,
      credits: assignment.subject?.credits
    },
    batch: {
      batch_id: assignment.batch?.batch_id,
      batch_name: assignment.batch?.batch_name
    },
    section: {
      section_id: assignment.section?.section_id,
      section_name: assignment.section?.section_name,
      classroom: {
        room_number: assignment.section?.classroom?.room_number,
        building_name: assignment.section?.classroom?.building_name
      }
    },
    roomNumber: assignment.roomNumber,
    buildingName: assignment.buildingName,
    role: assignment.role,
    hoursPerWeek: assignment.hoursPerWeek
  }));

  return {
    assignments: {
      teacherId: data.teacherId,
      totalActiveAssignments: data.totalActiveAssignments,
      assignments: normalizedAssignments,
      fetchedAt: Date.now()
    },
    weeklySchedule: data.weeklySchedule || {}
  };
};

/**
 * Extract teacher name for quick display
 * Works with both dashboard profile snapshot and full profile
 * @param {object} data - Profile data (could be from dashboard or profile endpoint)
 * @returns {string} - Teacher's full name
 */
export const getTeacherName = (data) => {
  if (!data) return 'Teacher';

  // From full profile endpoint
  if (data.firstName && data.lastName) {
    return `${data.firstName} ${data.lastName}`;
  }

  // From dashboard profile snapshot
  if (data.fullName) {
    return data.fullName;
  }

  return 'Teacher';
};

/**
 * Extract designation safely
 * @param {object} data - Profile data
 * @returns {string} - Designation or empty string
 */
export const getDesignation = (data) => {
  return data?.designation || 'Faculty';
};

/**
 * Extract department safely
 * @param {object} data - Profile data
 * @returns {string} - Department or empty string
 */
export const getDepartment = (data) => {
  return data?.department || 'School';
};
