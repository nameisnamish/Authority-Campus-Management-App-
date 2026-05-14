export const BASE_URL = 'https://7ce2-112-133-228-52.ngrok-free.app';

export const Teacher_dashboard_API_ROUTES = {
    TEACHER_DASHBOARD: `${BASE_URL}/api/teacher/dashboard`,
    // Add other routes here
};

export const Teacher_profile_API_ROUTES = {
    TEACHER_PROFILE: `${BASE_URL}/api/teacher/profile`,
    // Add other routes here
};

export const Teacher_schedule_API_ROUTES = {
    TEACHER_SCHEDULE: `${BASE_URL}/api/teacher/schedule`,
    // Add other routes here
};

export const Student_dashboard_API_ROUTES = {
    STUDENT_DASHBOARD: `${BASE_URL}/api/student/dashboard`,
    // Add other routes here
};

export const Student_schedule_API_ROUTES = {
    STUDENT_SCHEDULE: `${BASE_URL}/api/student/schedule`,
    STUDENT_SUBJECTS: `${BASE_URL}/api/student/subjects`,
    STUDENT_ATTENDANCE_REPORT: `${BASE_URL}/api/student/attendance/report`,
};

// Library QR Scanner Configuration
export const LIBRARY_QR_SECRETS = [
    'LIB_SECRET_001',
    'LIB_SECRET_002',
    'LIB_SECRET_003',
    'LIB_SECRET_004',
    'LIB_SECRET_005',
    'AxuTh_L1b_Qr_X9mK_2pZ_vN7wRjT4sY',
];

export const Library_API_ROUTES = {
    LIBRARY_CHECK_IN_OUT: `${BASE_URL}/api/library/check-in-out`,
    LIBRARY_VISIT: `${BASE_URL}/api/library/visit`,
    // Add other library routes here
};

export const FaceEnrollment_API_ROUTES = {
    ENROLL: `${BASE_URL}/api/student_face_enrollment`,
};

export const Class_Enrollment_API_ROUTES = {
    ENROLL: `${BASE_URL}/api/teacher/attendance/class-enrollments`,
};

export const Teacher_Attendance_Report_API_ROUTES = {
    REPORT: `${BASE_URL}/api/teacher/attendance/student-report`,

};

export const AttendanceStatus_Update_API_ROUTES = {
    UPDATE: `${BASE_URL}/api/teacher/attendance/update-status`,
};

export const Teacher_Attendance_API_ROUTES = {
    SUBMIT: `${BASE_URL}/api/teacher/attendance/submit`,
};

export const AUTH_API_ROUTES = {
    LOGIN: `${BASE_URL}/api/mobile/login`,
};

export const AI_API_ROUTES = {
    AI_CHAT: `${BASE_URL}/api/ai`,
};

export const Teacher_marks_API_ROUTES = {
    UPLOAD: `${BASE_URL}/api/teacher/marks_upload`,
};


