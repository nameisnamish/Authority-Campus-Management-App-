import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutAnimation, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import Notification from '../components/Notification';
import { Student_schedule_API_ROUTES } from '../lib/constants';
import { useCache } from '../hooks/useCache';
import { DATA_SCHEMAS } from '../lib/dataSchemas';
import { normalizeStudentScheduleData, normalizeSemesterSubjectsData } from '../utils/dataNormalizers';
import { getAccessToken } from '../utils/tokenStorage';


// ─── Skeleton Components ──────────────────────────────────────────────────────
const SkeletonPlaceholder = ({ style }) => {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  return <Animated.View style={[style, { opacity: animatedValue, backgroundColor: 'rgba(255,255,255,0.08)' }]} />;
};

const SubjectCardSkeleton = () => (
  <View style={styles.classCardSkeleton}>
    <View style={styles.skeletonHeaderRow}>
      <View style={{ flex: 1 }}>
        <SkeletonPlaceholder style={styles.skeletonTitle} />
        <SkeletonPlaceholder style={styles.skeletonSubtitle} />
      </View>
      <SkeletonPlaceholder style={styles.skeletonBadge} />
    </View>
    <SkeletonPlaceholder style={styles.skeletonBar} />
    <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 }} />
    <View style={styles.skeletonFooter}>
      <SkeletonPlaceholder style={styles.skeletonFooterItem} />
      <SkeletonPlaceholder style={styles.skeletonFooterItem} />
    </View>
  </View>
);

const ScheduleSkeleton = () => (
  <View style={styles.skeletonContainer}>
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <SkeletonPlaceholder style={styles.skeletonHeaderText} />
        <SkeletonPlaceholder style={[styles.skeletonHeaderText, { width: 140, height: 14, marginTop: 12 }]} />
      </View>
      <SkeletonPlaceholder style={styles.skeletonCircle} />
    </View>
    
    <View style={styles.skeletonTabs}>
      <SkeletonPlaceholder style={styles.skeletonTab} />
      <SkeletonPlaceholder style={styles.skeletonTab} />
    </View>

    <View style={{ marginBottom: 20 }}>
      <SkeletonPlaceholder style={{ width: 100, height: 16, marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[1, 2, 3, 4].map(i => (
          <SkeletonPlaceholder key={i} style={{ width: 70, height: 40, borderRadius: 20 }} />
        ))}
      </View>
    </View>

    {[1, 2, 3].map(i => (
      <SubjectCardSkeleton key={i} />
    ))}
  </View>
);

const EmptyState = ({ title, message, onRetry, icon = "book-outline", iconColor = colors.primaryPeach }) => (
  <View style={styles.emptyStateContainer}>
    <View style={[styles.emptyStateIconCircle, { backgroundColor: `${iconColor}15` }]}>
      <Ionicons name={icon} size={42} color={iconColor} />
    </View>
    <Text style={styles.emptyStateTitle}>{title}</Text>
    <Text style={styles.emptyStateMessage}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.emptyStateRetryButton} onPress={onRetry} activeOpacity={0.7}>
        <Ionicons name="refresh-outline" size={18} color="#000" />
        <Text style={styles.emptyStateRetryText}>Refresh Data</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Mapper Function ──────────────────────────────────────────────────────────
const mapEnrollmentToSubjectCard = (enrollment) => {
  const classroom = enrollment.section?.classroom || {};
  const roomNumber = classroom.room_number || 'N/A';
  
  return {
    id: enrollment.enrollmentId,
    subjectId: enrollment.subject?.subjectId?.toString() || '',
    title: enrollment.subject?.subjectName || 'Unknown Subject',
    tag: enrollment.section?.section_name || 'N/A',
    sectionName: enrollment.section?.section_name || 'N/A',
    subjectCode: enrollment.subject?.subjectCode || 'N/A',
    subjectType: enrollment.subject?.subjectType || 'Core',
    credits: enrollment.subject?.credits || 0,
    room: roomNumber,
    roomLabel: 'Room',
    roomIcon: enrollment.subject?.subject_type === 'Lab' ? 'flask-outline' : 'server-outline',
    attendance: enrollment.attendancePercentage || 0,
    teacher: enrollment.teacher?.name || 'Faculty',
    nextClass: 'Scheduled' 
  };
};

// ─── Helper renderers ──────────────────────────────────────────────────────────
const renderRoomBadge = (item) => {
  if (!item.room) return null;
  const isLab = item.roomLabel === 'Lab';
  const iconColor = isLab ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.05)';
  return (
    <View style={[styles.roomBadge, isLab && styles.roomBadgeLab]}>
      <Ionicons name={item.roomIcon} size={36} color={iconColor} style={styles.roomIconBackground} />
      <Text style={styles.roomLabel}>{item.roomLabel}</Text>
      <Text style={styles.roomNumber}>{item.room}</Text>
    </View>
  );
};

const renderAttendanceBar = (item) => {
  const pct = item.attendance;
  const barColor = pct >= 75 ? colors.primaryGreen : '#FF6B6B';
  return (
    <View style={styles.completionSection}>
      <View style={styles.completionHeader}>
        <Text style={styles.completionLabel}>Attendance</Text>
        <Text style={[styles.percentageText, { color: barColor }]}>{pct}%</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
};

const renderArrowButton = () => (
  <View style={styles.arrowButton}>
    <Ionicons name="chevron-forward" size={24} color={colors.textGrey} />
  </View>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export default function StudentSchedulePage({ navigation }) {
  const { getCachedData, setCachedData, isHydrated } = useCache();

  const [activeTab, setActiveTab] = useState('subjects');
  const [selectedSemester, setSelectedSemester] = useState(null); // null until API tells us
  const [activeSemester, setActiveSemester] = useState(null);    // real current sem from API
  const [classData, setClassData] = useState([]);                 // displayed subjects
  const [activeClassData, setActiveClassData] = useState([]);     // active sem subjects, preserved in memory
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSemLoading, setIsSemLoading] = useState(false);
  const [semError, setSemError] = useState(null);                 
  const [error, setError] = useState(null);
  const [academicYear, setAcademicYear] = useState('2024-25');
  const [termType, setTermType] = useState('EVEN');
  const [isNotificationVisible, setNotificationVisible] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [loading]);

  useEffect(() => {
    if (isHydrated) {
      fetchScheduleData();
    }
  }, [isHydrated]);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      
      // 1. Check schedule cache
      const cachedSchedule = getCachedData(DATA_SCHEMAS.STUDENT_SCHEDULE.cacheKey);
      // Also try the separately-cached profile to get the semester number
      const cachedProfile = getCachedData(DATA_SCHEMAS.STUDENT_PROFILE.cacheKey);

      if (cachedSchedule) {
        console.log('[StudentSchedule] Using cached schedule data');
        const transformedSubjects = cachedSchedule.enrolledSubjects.subjects.map(mapEnrollmentToSubjectCard);
        setClassData(transformedSubjects);
        setActiveClassData(transformedSubjects); // preserve for quick restore
        setWeeklySchedule(cachedSchedule.weeklySchedule || {});
        
        // Get semester from profile cache OR from inside schedule cache
        const sem =
          cachedProfile?.semester ||
          cachedSchedule.studentProfile?.semester ||
          4; // Fallback to 4 if absolutely nothing found in cache
        
        console.log(`[StudentSchedule] Setting semesters from cache: ${sem}`);
        setSelectedSemester(sem);
        setActiveSemester(sem);

        const profile = cachedProfile || cachedSchedule.studentProfile;
        if (profile) {
          setAcademicYear(profile.academicYear || '2024-25');
          setTermType(profile.termType || 'EVEN');
        }
        
        setLoading(false);
        return;
      }

      // 2. Fetch from API
      const token = getAccessToken();
      const response = await fetch(Student_schedule_API_ROUTES.STUDENT_SCHEDULE, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'ReactNative',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch student schedule: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('📡 [StudentSchedule] API fetch successful');
      
      if (result.success && result.data) {
        const normalizedData = normalizeStudentScheduleData(result);
        
        // Cache normalized schedule data
        setCachedData(DATA_SCHEMAS.STUDENT_SCHEDULE.cacheKey, normalizedData);

        // Cache student profile separately so StudentProfilePage can use it
        if (normalizedData.studentProfile) {
          setCachedData(DATA_SCHEMAS.STUDENT_PROFILE.cacheKey, normalizedData.studentProfile);
          
          const sem = normalizedData.studentProfile.semester || 4; // Fallback to 4 if API field missing
          console.log(`[StudentSchedule] Detected Semester ${sem} from API`);
          setSelectedSemester(sem);
          setActiveSemester(sem);
          setAcademicYear(normalizedData.studentProfile.academicYear || '2024-25');
          setTermType(normalizedData.studentProfile.termType || 'EVEN');
        } else {
          // If profile is missing entirely, default to 4 so UI doesn't lock
          setSelectedSemester(4);
          setActiveSemester(4);
        }

        const transformedSubjects = normalizedData.enrolledSubjects.subjects.map(mapEnrollmentToSubjectCard);
        
        console.log('✅ [StudentSchedule] Setting state with subjects:', transformedSubjects.length, 'Weekly slots:', Object.keys(normalizedData.weeklySchedule).length);
        
        setClassData(transformedSubjects);
        setActiveClassData(transformedSubjects); // preserve for quick restore
        setWeeklySchedule(normalizedData.weeklySchedule || {});
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching student schedule:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSemesterSubjects = async (semester) => {
    try {
      setIsSemLoading(true);
      setSemError(null);
      
      // 1. Check per-semester cache first
      const cacheKey = `${DATA_SCHEMAS.SEMESTER_SUBJECTS.cacheKey}_sem_${semester}`;
      const cachedData = getCachedData(cacheKey);
      
      if (cachedData) {
        console.log(`[StudentSubjects] Cache hit for Sem ${semester}`);
        const transformedSubjects = cachedData.subjects.map(mapEnrollmentToSubjectCard);
        setClassData(transformedSubjects);
        setIsSemLoading(false);
        return;
      }

      // 2. Fetch from API
      const token = getAccessToken();
      const url = `${Student_schedule_API_ROUTES.STUDENT_SUBJECTS}?semester=${semester}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'ReactNative',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 404) {
        // Special case: 404 means no records for this semester yet
        setSemError("NO_DATA");
        setClassData([]);
        return;
      }

      if (!response.ok) throw new Error(`Server error ${response.status}`);

      const result = await response.json();
      if (result.success && result.data && result.data.subjects?.length > 0) {
        const normalized = normalizeSemesterSubjectsData(result);
        setCachedData(cacheKey, normalized);
        const transformedSubjects = normalized.subjects.map(mapEnrollmentToSubjectCard);
        setClassData(transformedSubjects);
      } else {
        // success but empty list
        setSemError("NO_DATA");
        setClassData([]);
      }
    } catch (err) {
      console.error(`[StudentSubjects] Error fetching Sem ${semester}:`, err);
      setSemError("NETWORK_ERROR");
      setClassData([]);
    } finally {
      setIsSemLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const handleSemesterChange = (sem) => {
    // Don't allow switching while initial data is still loading or sem is unknown
    if (loading || activeSemester === null) return;
    if (sem === selectedSemester) return; // already on this tab, do nothing
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSemError(null);
    setSelectedSemester(sem);
    
    if (sem === activeSemester) {
      // Restore the active semester data from memory — no API call
      setClassData(activeClassData);
    } else {
      // Fetch (or load from cache) the historical semester
      fetchSemesterSubjects(sem);
    }
  };

  // ── Dynamic stats ────────────────────────────────────────────────────────────
  const calculateStats = () => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let totalClasses = 0;
    const dayStats = {};
    daysOfWeek.forEach((day) => {
      const classes = weeklySchedule[day] || [];
      dayStats[day] = { classes: classes.length, hours: classes.length };
      totalClasses += classes.length;
    });
    
    const avgAttendance = classData.length > 0 
      ? Math.round(classData.reduce((acc, s) => acc + s.attendance, 0) / classData.length)
      : 0;

    return { totalClasses: totalClasses.toString(), avgAttendance: `${avgAttendance}%`, dayStats };
  };

  const stats = calculateStats();

  // ── Subject card ─────────────────────────────────────────────────────────────
  const renderSubjectCard = (item) => (
    <TouchableOpacity 
      key={item.id} 
      style={styles.classCard} 
      activeOpacity={0.85}
      onPress={() => navigation.navigate('StudentSyllabusLearningPath', { subject: item })}
    >
      <View style={styles.cardTopSection}>
        <View style={styles.tagAndTitle}>
          <Text style={styles.classTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>{item.sectionName}</Text>
          <View style={styles.metaInfoRow}>
            <Text style={styles.metaInfoText}>{item.subjectCode}</Text>
            <Text style={styles.metaInfoText}>•</Text>
            <Text style={styles.metaInfoText}>{item.subjectType}</Text>
            <Text style={styles.metaInfoText}>•</Text>
            <Text style={styles.metaInfoText}>{item.credits} Credits</Text>
          </View>
        </View>
        {renderRoomBadge(item)}
        {renderArrowButton()}
      </View>

      {renderAttendanceBar(item)}

      {/* Teacher & Next Class */}
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>TEACHER</Text>
          <Text style={styles.statValue}>{item.teacher}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>NEXT CLASS</Text>
          <Text style={styles.statValue}>{item.nextClass}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ── Weekly planner grid ──────────────────────────────────────────────────────
  const renderWeeklyPlanner = () => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Fixed Time Slots in increasing order
    const FIXED_TIME_SLOTS = [
      { label: '9:00 AM', startTime: '09:00:00' },
      { label: '10:00 AM', startTime: '10:00:00' },
      { label: '11:00 AM', startTime: '11:00:00' },
      { label: '12:00 PM', startTime: '12:00:00' },
      { label: '1:00 PM', startTime: '13:00:00', isLunch: true },
      { label: '2:00 PM', startTime: '14:00:00' },
      { label: '3:00 PM', startTime: '15:00:00' },
      { label: '4:00 PM', startTime: '16:00:00' },
      { label: '5:00 PM', startTime: '17:00:00' },
    ];

    // Helper to extract time HH:mm:ss from ISO string or use direct string
    const getComparisonTime = (timeString) => {
      if (!timeString) return '';
      if (timeString.includes('T')) {
        return timeString.split('T')[1]?.split('.')[0];
      }
      return timeString;
    };

    return (
      <View style={styles.plannerGridContainer}>
        <View style={styles.plannerGridWrapper}>
          {/* Fixed Left Column: Days */}
          <View style={styles.fixedDayColumn}>
            {/* Empty header cell aligned with time header */}
            <View style={styles.dayColumnHeaderFixed} />
            {/* Day cells */}
            {daysOfWeek.map(day => (
              <View key={`day-${day}`} style={styles.dayCellFixed}>
                <Text style={styles.dayCellText}>{day.substring(0, 3)}</Text>
              </View>
            ))}
          </View>

          {/* Horizontally Scrollable Section: Time Slots & Classes */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableContent}>
            <View>
              {/* Header Row: Timing Slots */}
              <View style={styles.gridRow}>
                {FIXED_TIME_SLOTS.map(slot => (
                  <View key={slot.label} style={styles.timeHeaderCell}>
                    <Text style={styles.dayHeaderText}>{slot.label}</Text>
                  </View>
                ))}
              </View>

              {/* Day Rows with Class Cards */}
              {daysOfWeek.map(day => (
                <View key={`row-${day}`} style={styles.gridRow}>
                  {FIXED_TIME_SLOTS.map(slot => {
                    if (slot.isLunch) {
                      return (
                        <View key={`${day}-${slot.label}`} style={[styles.gridCell, styles.lunchCell]}>
                          <Ionicons name="restaurant-outline" size={12} color={colors.primaryPeach} />
                          <Text style={styles.lunchTextVertical}>LUNCH</Text>
                        </View>
                      );
                    }

                    const dayClasses = weeklySchedule[day] || [];
                    const classAtTime = dayClasses.find(c => {
                      const compTime = getComparisonTime(c.startTime);
                      const isMatch = compTime === slot.startTime;
                      if (day === 'Monday' && isMatch) {
                        console.log(`📍 [PlannerMatch] ${day} ${slot.label} matches ${c.subjectName}`);
                      }
                      return isMatch;
                    });

                    return (
                      <View key={`${day}-${slot.label}`} style={styles.gridCell}>
                        {classAtTime ? (
                          <View style={styles.gridClassCard}>
                            <Text style={styles.gridClassTitle} numberOfLines={2}>
                              {classAtTime.subjectName || 'Class'}
                            </Text>
                            <Text style={styles.gridClassRoom} numberOfLines={1}>
                              {classAtTime.sectionName || 'Batch'}
                            </Text>
                            <Text style={styles.gridClassRoom} numberOfLines={1}>
                              {classAtTime.room || 'N/A'}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  // ── Semester Selector ────────────────────────────────────────────────────────
  const renderSemesterSelector = () => {
    const semesters = [1, 2, 3, 4, 5, 6];
    const isDisabled = loading || activeSemester === null;
    return (
      <View style={styles.semesterSelectorContainer}>
        <Text style={styles.semesterSelectorLabel}>Select Semester</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.semesterScroll}>
          {semesters.map((sem) => (
            <TouchableOpacity
              key={`sem-${sem}`}
              style={[
                styles.semesterButton,
                selectedSemester === sem && styles.semesterButtonActive,
                isDisabled && { opacity: 0.4 }
              ]}
              onPress={() => handleSemesterChange(sem)}
              disabled={isDisabled}
            >
              <Text style={[
                styles.semesterButtonText,
                selectedSemester === sem && styles.semesterButtonTextActive
              ]}>
                Sem {sem}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ScheduleSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <EmptyState 
          title="Connection Error" 
          message={error} 
          onRetry={fetchScheduleData} 
        />
      </SafeAreaView>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Schedule &</Text>
            <Text style={styles.headerTitle}>Subjects</Text>
            <Text style={styles.semesterInfo}>Academic Year {academicYear} • {termType} Term</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton} onPress={() => setNotificationVisible(true)}>
            <Ionicons name="notifications-outline" size={24} color={colors.textWhite} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'subjects' && styles.tabActive]}
            onPress={() => handleTabChange('subjects')}
          >
            <Text style={[styles.tabText, activeTab === 'subjects' && styles.tabTextActive]}>
              My Subjects
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'planner' && styles.tabActive]}
            onPress={() => handleTabChange('planner')}
          >
            <Text style={[styles.tabText, activeTab === 'planner' && styles.tabTextActive]}>
              Weekly Planner
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subjects Tab */}
        {activeTab === 'subjects' && (
          <>
            {renderSemesterSelector()}
            <View style={styles.classesContainer}>
              {isSemLoading ? (
                <View style={styles.classesContainer}>
                  {[1, 2, 3].map(i => <SubjectCardSkeleton key={i} />)}
                </View>
              ) : semError === "NO_DATA" ? (
                <EmptyState
                  title={`No Subjects Found`}
                  message={`We don't have any enrolled subjects on file for Semester ${selectedSemester} yet.`}
                  icon="journal-outline"
                  iconColor={colors.textGrey}
                />
              ) : semError === "NETWORK_ERROR" ? (
                <EmptyState
                  title="Connection Issue"
                  message="We're having trouble connecting to the academic portal. Check your internet or try again."
                  icon="wifi-outline"
                  iconColor="#FF6B6B"
                  onRetry={() => fetchSemesterSubjects(selectedSemester)}
                />
              ) : classData && classData.length > 0 ? (
                classData.map((item) => renderSubjectCard(item))
              ) : (
                <EmptyState 
                  title={`Semester ${selectedSemester}`} 
                  message="No records found for this academic period."
                  onRetry={selectedSemester !== activeSemester ? () => fetchSemesterSubjects(selectedSemester) : fetchScheduleData}
                />
              )}
            </View>
          </>
        )}

        {/* Planner Tab */}
        {activeTab === 'planner' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.plannerContainer}>
              {renderWeeklyPlanner()}
            </View>

            {/* Weekly Summary */}
            <View style={styles.summarySection}>
              <Text style={styles.sectionHeading}>Weekly Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Weekly Classes</Text>
                  <Text style={styles.summaryValueGreen}>{stats.totalClasses} Classes</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Avg. Attendance</Text>
                  <Text style={styles.summaryValuePeach}>{stats.avgAttendance}</Text>
                </View>
              </View>

              <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Daily Breakdown</Text>
              <View style={styles.dailyGrid}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                  <View key={day} style={styles.dailyStatCard}>
                    <Text style={styles.dailyDayName}>{day.substring(0, 3)}</Text>
                    <View style={styles.dailyStatContent}>
                      <View style={styles.dailyStatItem}>
                        <Text style={styles.dailyStatValue}>{stats.dayStats[day].hours}</Text>
                        <Text style={styles.dailyStatLabel}>HRS</Text>
                      </View>
                      <View style={styles.dailyStatDivider} />
                      <View style={styles.dailyStatItem}>
                        <Text style={styles.dailyStatValue}>{stats.dayStats[day].classes}</Text>
                        <Text style={styles.dailyStatLabel}>CLASS</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Student Spotlight */}
            <View style={styles.spotlightSection}>
              <Text style={styles.sectionHeading}>Student Notice</Text>
              <Text style={styles.spotlightText}>
                Mid-semester examinations for {termType} Term are scheduled for the last week of May {academicYear.split('-')[1] || '2025'}. Check your exam timetable on the portal.
              </Text>
              <TouchableOpacity style={styles.spotlightLink}>
                <Text style={styles.spotlightLinkText}>View Exam Schedule </Text>
                <Ionicons name="open-outline" size={14} color={colors.primaryGreen} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      </Animated.View>
      <Notification visible={isNotificationVisible} onClose={() => setNotificationVisible(false)} />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: colors.textWhite,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  headerLeft: { flex: 1 },
  headerTitle: {
    color: colors.textWhite,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  semesterInfo: {
    color: colors.textGrey,
    fontSize: typography.body2,
    marginTop: 6,
  },
  notificationButton: {
    position: 'relative',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: colors.primaryPeach,
    borderRadius: 4,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 6,
    marginBottom: 24,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 24,
  },
  tabActive: { backgroundColor: colors.primaryPeach },
  tabText: {
    color: colors.textGrey,
    fontSize: typography.body2,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '700',
  },

  // Semester Selector
  semesterSelectorContainer: {
    marginBottom: 24,
  },
  semesterSelectorLabel: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  semesterScroll: {
    gap: 12,
    paddingRight: 20,
  },
  semesterButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minWidth: 85,
    alignItems: 'center',
  },
  semesterButtonActive: {
    backgroundColor: colors.primaryGreen,
    borderColor: colors.primaryGreen,
    elevation: 4,
    shadowColor: colors.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  semesterButtonText: {
    color: colors.textGrey,
    fontSize: 14,
    fontWeight: '700',
  },
  semesterButtonTextActive: {
    color: '#000000',
    fontWeight: '800',
  },

  // Subject cards
  classesContainer: { gap: 16 },
  classCard: {
    backgroundColor: colors.surface,
    borderRadius: 32,
    padding: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tagAndTitle: { flex: 1 },
  classTitle: {
    color: colors.textWhite,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },
  cardSubtitle: {
    color: colors.textGrey,
    fontSize: 14,
    marginTop: 4,
  },
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaInfoText: {
    color: colors.textGrey,
    fontSize: 11,
    fontWeight: '500',
  },
  arrowButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 12,
  },

  // Room badge
  roomBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  roomBadgeLab: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  roomIconBackground: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    transform: [{ rotate: '-15deg' }],
  },
  roomLabel: {
    color: colors.textGrey,
    fontSize: 11,
    fontWeight: '700',
  },
  roomNumber: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '800',
  },

  // Attendance bar
  completionSection: { marginBottom: 14 },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  completionLabel: {
    color: colors.textGrey,
    fontSize: typography.body2,
    fontWeight: '600',
  },
  percentageText: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },

  // Stats row
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 4,
  },
  statItem: { flex: 1 },
  statLabel: {
    color: colors.textGrey,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '800',
  },

  // Empty state
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    color: colors.textWhite,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateMessage: {
    color: colors.textGrey,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  emptyStateRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryGreen,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    gap: 8,
  },
  emptyStateRetryText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },

  // Planner layout
  tabContentContainer: { flex: 1, width: '100%' },
  plannerContainer: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 24,
    minHeight: 200,
    width: '100%',
    overflow: 'hidden',
  },
  plannerGridContainer: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 10,
  },
  plannerGridWrapper: { flexDirection: 'row', flex: 1 },
  fixedDayColumn: {
    width: 60,
    backgroundColor: colors.surface,
    zIndex: 10,
    borderRightWidth: 2,
    borderRightColor: 'rgba(255,255,255,0.05)',
  },
  dayColumnHeaderFixed: { width: 60, height: 40 },
  dayCellFixed: {
    width: 60,
    height: 85,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.05)',
  },
  dayCellText: {
    color: colors.primaryPeach,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  scrollableContent: { flex: 1 },
  gridRow: { flexDirection: 'row' },
  timeHeaderCell: {
    width: 100,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dayHeaderText: {
    color: colors.primaryPeach,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  gridCell: {
    width: 100,
    height: 85,
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.05)',
  },
  gridClassCard: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 6,
    justifyContent: 'space-between',
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryGreen,
  },
  gridClassTitle: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: '700',
  },
  gridClassRoom: {
    color: colors.textGrey,
    fontSize: 8,
    marginTop: 2,
  },
  lunchCell: {
    backgroundColor: 'rgba(255, 174, 136, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  lunchTextVertical: {
    color: colors.primaryPeach,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Summary section
  summarySection: { marginTop: 32 },
  sectionHeading: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  summaryLabel: { color: colors.textGrey, fontSize: 14 },
  summaryValueGreen: {
    color: colors.primaryGreen,
    fontSize: 16,
    fontWeight: '700',
  },
  summaryValuePeach: {
    color: '#FFAE88',
    fontSize: 16,
    fontWeight: '700',
  },

  // Daily breakdown grid
  dailyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  dailyStatCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 12,
    width: '30%',
    flexGrow: 1,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  dailyDayName: {
    color: colors.primaryPeach,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  dailyStatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dailyStatItem: { alignItems: 'center' },
  dailyStatValue: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '800',
  },
  dailyStatLabel: {
    color: colors.textGrey,
    fontSize: 8,
    fontWeight: '600',
  },
  dailyStatDivider: {
    width: 1,
    height: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // Student spotlight / notice
  spotlightSection: {
    marginTop: 24,
    backgroundColor: '#1E1E1E',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  spotlightText: {
    color: colors.textGrey,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
    marginTop: -4,
  },
  spotlightLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spotlightLinkText: {
    color: colors.primaryGreen,
    fontSize: 14,
    fontWeight: '600',
  },
  tabLoadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTabText: {
    color: colors.textGrey,
    fontSize: 14,
    marginTop: 12,
  },

  // Skeleton Styles
  skeletonContainer: {
    flex: 1,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  skeletonHeaderText: {
    width: 180,
    height: 32,
    borderRadius: 8,
  },
  skeletonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  skeletonTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 6,
    borderRadius: 30,
  },
  skeletonTab: {
    flex: 1,
    height: 48,
    borderRadius: 24,
  },
  classCardSkeleton: {
    backgroundColor: colors.surface,
    borderRadius: 32,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonTitle: {
    width: '70%',
    height: 24,
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    width: '40%',
    height: 16,
    borderRadius: 4,
  },
  skeletonBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  skeletonBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginTop: 12,
  },
  skeletonFooter: {
    flexDirection: 'row',
    gap: 24,
  },
  skeletonFooterItem: {
    flex: 1,
    height: 16,
    borderRadius: 4,
  },
});
