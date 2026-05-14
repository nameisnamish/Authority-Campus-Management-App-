/**
 * Data Schemas - Define cache structure and metadata for each data type
 * Acts as documentation and validation blueprint
 */

export const DATA_SCHEMAS = {
  // Teacher Profile: Complete teacher info - SINGLE SOURCE OF TRUTH
  TEACHER_PROFILE: {
    cacheKey: 'teacherProfile',
    ttl: 86400000, // 24 hours - rarely changes
    source: '/api/teacher/profile',
    description: 'Complete teacher profile with all details',
    requiredFields: [
      'id',
      'firstName',
      'lastName',
      'designation',
      'department',
      'collegeEmail',
      'status'
    ]
  },

  // Today's Schedule: Just today's classes
  TODAY_SCHEDULE: {
    cacheKey: 'todaySchedule',
    ttl: 1800000, // 30 minutes - changes daily/frequently
    source: '/api/teacher/dashboard',
    description: 'Today specific classes schedule',
    requiredFields: ['schedule', 'meta']
  },

  // Assignments: All subject assignments with classroom details
  ASSIGNMENTS: {
    cacheKey: 'assignments',
    ttl: 43200000, // 12 hours - rarely changes
    source: '/api/teacher/schedule',
    description: 'All teacher subject assignments with classroom info',
    requiredFields: ['assignments', 'teacherId'],
    structure: {
      teacherId: 'string',
      totalActiveAssignments: 'number',
      assignments: [{
        assignmentId: 'string',
        subject: {
          subject_id: 'string',
          subject_code: 'string',
          subject_name: 'string',
          subject_type: 'string',
          credits: 'number'
        },
        batch: {
          batch_id: 'string',
          batch_name: 'string'
        },
        section: {
          section_id: 'string',
          section_name: 'string',
          classroom: {
            room_number: 'string',
            building_name: 'string'
          }
        },
        roomNumber: 'string',
        buildingName: 'string',
        role: 'string',
        hoursPerWeek: 'number'
      }],
      fetchedAt: 'timestamp'
    }
  },

  // Weekly Schedule: Template schedule
  WEEKLY_SCHEDULE: {
    cacheKey: 'weeklySchedule',
    ttl: 43200000, // 12 hours - rarely changes
    source: '/api/teacher/schedule',
    description: 'Weekly schedule template',
    requiredFields: [] 
  },

  // Class Enrollment: List of students enrolled in a subject
  CLASS_ENROLLMENT: {
    cacheKey: 'studentList', // Dynamic: 'studentList_{subject_id}'
    ttl: 1800000, // 30 minutes - can change as attendance updates
    source: '/api/teacher/attendance/class-enrollments',
    description: 'List of students enrolled in a subject with basic attendance info',
    requiredFields: ['subjectId', 'sectionId', 'students'],
    structure: {
      subjectId: 'string',
      sectionId: 'string',
      periodName: 'string',
      totalStudents: 'number',
      students: [{
        id: 'string',
        name: 'string',
        rollNumber: 'string',
        profileImage: 'string|null',
        batchName: 'string',
        programName: 'string',
        attendancePercentage: 'number'
      }]
    }
  },

  // Student Attendance Report: Detailed attendance data for a student
  TEACHER_STUDENT_ATTENDANCE_REPORT: {
    cacheKey: 'studentReport', // Dynamic: 'studentReport_{student_id}_{subject_id}_{month}_{year}'
    ttl: 3600000, // 1 hour - detailed data
    source: '/api/teacher/attendance/student-report',
    description: 'Detailed attendance report with calendar data for a specific student',
    requiredFields: ['studentInfo', 'stats', 'calendar'],
    structure: {
      studentInfo: {
        name: 'string',
        rollNumber: 'string'
      },
      stats: {
        overallPercentage: 'number',
        totalClasses: 'number',
        classesAttended: 'number',
        classesMissed: 'number'
      },
      calendar: {
        '[YYYY-MM-DD]': {
          attendanceId: 'string',
          status: 'PRESENT|ABSENT|LEAVE', // or 'none' for non-class days
          sessionDetail: {
            startTime: 'string',
            endTime: 'string',
            slotName: 'string',
            room: 'string',
            building: 'string'
          }
        }
      }
    }
  },
  
  // Student Profile: Complete student info
  STUDENT_PROFILE: {
    cacheKey: 'studentProfile',
    ttl: 86400000, // 24 hours
    source: '/api/student/profile',
    description: 'Complete student profile details',
    requiredFields: ['id', 'name', 'usn', 'email']
  },

  // Student Schedule: Full enrolled subjects and weekly planner
  STUDENT_SCHEDULE: {
    cacheKey: 'studentSchedule',
    ttl: 300000, // 5 minutes - Short lived to keep planner fresh and memory clean
    source: '/api/student/schedule',
    description: 'Full student schedule and weekly planner',
    requiredFields: ['enrolledSubjects', 'weeklySchedule']
  },

  // Dashboard Subjects: Lightweight subjects list for dashboard display
  DASHBOARD_SUBJECTS: {
    cacheKey: 'dashboardSubjects',
    ttl: 1800000, // 30 minutes - Matches dashboard frequency
    source: '/api/student/schedule (extracted)',
    description: 'Lightweight subject list for dashboard cards',
    requiredFields: ['subjects']
  },

  // Semester Subjects: Historical subject lists
  SEMESTER_SUBJECTS: {
    cacheKey: 'studentSubjects', // Dynamic: 'studentSubjects_sem_{semester}'
    ttl: 86400000, // 24 hours
    source: '/api/student/subjects',
    description: 'Historical semester subject list',
    requiredFields: ['semester', 'subjects']
  },
  
  // Student Dashboard: Live classes and daily overview
  STUDENT_DASHBOARD: {
    cacheKey: 'studentDashboard',
    ttl: 1200000, // 20 minutes - live classes change
    source: '/api/student/dashboard',
    description: 'Current live classes and overall attendance overview',
    requiredFields: ['student', 'todaySchedule', 'overallAttendance']
  }
};

/**
 * Check if cached data is still valid based on TTL
 * @param {number} cachedAt - Timestamp when data was cached
 * @param {number} ttl - Time to live in milliseconds
 * @returns {boolean} - True if cache is still valid
 */
export const isCacheValid = (cachedAt, ttl) => {
  if (!cachedAt || !ttl) return false;
  const now = Date.now();
  return now - cachedAt < ttl;
};

/**
 * Validate cached data against schema
 * @param {object} data - Data to validate
 * @param {array} requiredFields - Required field names
 * @returns {boolean} - True if valid
 */
export const validateCacheData = (data, requiredFields) => {
  if (!data || typeof data !== 'object') return false;
  
  return requiredFields.every(field => {
    return field in data && data[field] !== undefined;
  });
};
