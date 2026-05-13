import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutAnimation, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import Notification from '../components/Notification';
import { Teacher_schedule_API_ROUTES } from '../lib/constants';
import { useCache } from '../hooks/useCache';
import { DATA_SCHEMAS } from '../lib/dataSchemas';
import { normalizeScheduleData } from '../utils/dataNormalizers';
import { getAccessToken } from '../utils/tokenStorage';

// Mapping function to transform API assignments into class card format
const mapAssignmentToClassCard = (assignment) => {
  // Extract classroom info from nested structure
  const classroom = assignment.section?.classroom || {};
  const roomNumber = classroom.room_number || assignment.roomNumber || 'N/A';
  const buildingName = classroom.building_name || assignment.buildingName || 'Building';
  
  // Debug log
  console.log(`Mapping assignment ${assignment.assignmentId}:`, {
    hasClassroom: !!assignment.section?.classroom,
    classroomRoomNumber: classroom.room_number,
    assignmentRoomNumber: assignment.roomNumber,
    finalRoomNumber: roomNumber,
    sectionId: assignment.section?.section_id
  });
  
  return {
    // Identifiers - for API calls
    id: assignment.assignmentId,
    assignmentId: assignment.assignmentId,
    subjectId: assignment.subject.subject_id,
    sectionId: assignment.section.section_id,
    batchId: assignment.batch.batch_id,
    
    // Display info
    title: assignment.subject.subject_name,
    tag: assignment.batch.batch_name,
    sectionName: assignment.section.section_name,
    
    // Subject details
    subjectCode: assignment.subject.subject_code,
    subjectType: assignment.subject.subject_type,
    credits: assignment.subject.credits,
    
    // Room/Building info
    roomLabel: 'Room',
    roomNumber: roomNumber,
    room: roomNumber, // Display room number
    buildingName: buildingName,
    roomIcon: 'server-outline',
    
    // Additional details
    role: assignment.role,
    hoursPerWeek: assignment.hoursPerWeek,
    
    // Data to be fetched later
    completion: 0,
    students: 0,
    avgScore: null,
    materials: false,
    rollCall: false,
    assessment: null
  };
};




const renderTopBadge = (classItem) => {
  if (classItem.status === 'ACTIVE_SESSION') {
    return (
      <View style={styles.topBadgeRow}>
        <View style={styles.activeSessionBadge}>
          <Text style={styles.activeSessionText}>ACTIVE SESSION</Text>
        </View>
      </View>
    );
  }
  return null;
};

const renderRoomBadge = (classItem) => {
  if (!classItem.room) return null;

  const isLab = classItem.roomLabel === 'Lab';
  const iconColor = isLab ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.05)';

  return (
    <View style={[styles.roomBadge, isLab && styles.roomBadgeLab]}>
      <Ionicons name={classItem.roomIcon} size={36} color={iconColor} style={styles.roomIconBackground} />
      <Text style={styles.roomLabel}>{classItem.roomLabel}</Text>
      <Text style={styles.roomNumber}>{classItem.room}</Text>
    </View>
  );
};

const renderCompletion = (classItem) => (
  <View style={styles.completionSection}>
    <View style={styles.completionHeader}>
      <Text style={styles.completionLabel}>Syllabus Completion</Text>
      <Text style={styles.percentageText}>{classItem.completion}%</Text>
    </View>
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { width: `${classItem.completion}%` }]} />
    </View>
  </View>
);

const renderStats = (classItem) => {
  if (!classItem.students && !classItem.avgScore) return null;

  return (
    <View style={styles.statsSection}>
      {classItem.avgScore && (
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>AVG SCORE</Text>
          <Text style={styles.statValue}>{classItem.avgScore}</Text>
        </View>
      )}
      {classItem.students && (
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>STUDENTS</Text>
          <Text style={styles.statValue}>{classItem.students} Active</Text>
        </View>
      )}
    </View>
  );
};

const renderActions = (classItem) => {
  if (!classItem.materials && !classItem.rollCall) return null;

  return (
    <View style={styles.actionsSection}>
      {classItem.materials && (
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="document-outline" size={16} color={colors.textWhite} />
          <Text style={styles.actionText}>Materials</Text>
        </TouchableOpacity>
      )}
      {classItem.rollCall && (
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="people-outline" size={16} color={colors.textWhite} />
          <Text style={styles.actionText}>Roll Call</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const renderAssessment = (classItem) => {
  if (!classItem.assessment) return null;

  return (
    <View style={styles.assessmentInfo}>
      <Ionicons name="calendar-outline" size={16} color="#FFAE88" />
      <Text style={styles.assessmentText}>{classItem.assessment}</Text>
    </View>
  );
};

const renderArrowButton = () => {
  return (
    <View style={styles.arrowButton}>
      <Ionicons name="chevron-forward" size={24} color={colors.textGrey} />
    </View>
  );
};



export default function TeacherSchedulePage({ navigation }) {
  // Cache hook
  const { getCachedData, setCachedData, isHydrated } = useCache();
  
  const [activeTab, setActiveTab] = useState('subjects');
  const [classData, setClassData] = useState([]);
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNotificationVisible, setNotificationVisible] = useState(false);

  const calculateDynamicStats = () => {
    let totalClasses = 0;
    let totalHours = 0;
    const dayStats = {};
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    daysOfWeek.forEach(day => {
      const classes = weeklySchedule[day] || [];
      const count = classes.length;
      dayStats[day] = {
        classes: count,
        hours: count // Assuming 1 hour per slot
      };
      totalClasses += count;
      totalHours += count;
    });

    return {
      weeklyLoad: `${totalHours} Hours`,
      totalClasses: totalClasses.toString(),
      upcomingExams: '3 Scheduled',
      dayStats
    };
  };

  const dynamicStats = calculateDynamicStats();

  useEffect(() => {
    if (isHydrated) {
      fetchScheduleData();
    }
  }, [isHydrated]);

  const fetchScheduleData = async () => {
    try {
      setLoading(true);

      // 1. Check cache for assignments
      const cachedAssignments = getCachedData(
        DATA_SCHEMAS.ASSIGNMENTS.cacheKey
      );
      
      // 2. Check cache for weekly schedule
      const cachedWeekly = getCachedData(
        DATA_SCHEMAS.WEEKLY_SCHEDULE.cacheKey
      );

      if (cachedAssignments && cachedWeekly) {
        // Use cached data - cache contains normalized structure
        console.log('Using Cached Assignments:', cachedAssignments);
        console.log('Using Cached Weekly Schedule:', cachedWeekly);
        // Cache already contains the full object: { teacherId, totalActiveAssignments, assignments, fetchedAt }
        const transformedClasses = cachedAssignments.assignments.map(
          mapAssignmentToClassCard
        );
        setClassData(transformedClasses);
        setWeeklySchedule(cachedWeekly || {});

        setError(null);
        setLoading(false);
        return;
      }

      // Not fully cached, fetch from API
      const token = getAccessToken();
      
      console.log('📡 Fetching schedule with JWT token:', token ? '✅ Present' : '❌ Missing');
      console.log('🔗 API URL:', Teacher_schedule_API_ROUTES.TEACHER_SCHEDULE);
      
      const response = await fetch(Teacher_schedule_API_ROUTES.TEACHER_SCHEDULE, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'ReactNative',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch schedule data: ${response.status}`);
      }

      const result = await response.json();
      console.log('Raw API Response:', JSON.stringify(result, null, 2));

      if (result.success && result.data) {
        // Normalize the API response
        const normalizedData = normalizeScheduleData(result);
        console.log('Normalized Data:', normalizedData);

        // Cache the normalized data with proper structure
        // Cache stores: { teacherId, totalActiveAssignments, assignments, fetchedAt }
        setCachedData(
          DATA_SCHEMAS.ASSIGNMENTS.cacheKey,
          normalizedData.assignments
        );
        // Cache stores: { Monday: [...], Tuesday: [...], etc }
        setCachedData(
          DATA_SCHEMAS.WEEKLY_SCHEDULE.cacheKey,
          normalizedData.weeklySchedule
        );

        // Transform for UI display using normalized assignments
        const transformedClasses = normalizedData.assignments.assignments.map(
          mapAssignmentToClassCard
        );
        console.log('Transformed Classes:', transformedClasses);
        setClassData(transformedClasses);
        setWeeklySchedule(normalizedData.weeklySchedule || {});
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching schedule data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const renderClassCard = (classItem, index) => {
    // Debug log to check room data
    console.log(`Card ${index}:`, {
      title: classItem.title,
      room: classItem.room,
      roomNumber: classItem.roomNumber,
      buildingName: classItem.buildingName,
      sectionId: classItem.sectionId
    });

    return (
      <TouchableOpacity key={classItem.id} style={styles.classCard} onPress={() => navigation.navigate('TeacherSubjectManager', { subject: classItem })}>
        {renderTopBadge(classItem)}
        <View style={styles.cardTopSection}>
          <View style={styles.tagAndTitle}>
            <Text style={styles.classTitle}>{classItem.title}</Text>
            <Text style={styles.cardSubtitle}>{classItem.tag} • {classItem.sectionName}</Text>
            <View style={styles.metaInfoRow}>
              <Text style={styles.metaInfoText}>{classItem.subjectCode}</Text>
              <Text style={styles.metaInfoText}>•</Text>
              <Text style={styles.metaInfoText}>{classItem.subjectType}</Text>
              <Text style={styles.metaInfoText}>•</Text>
              <Text style={styles.metaInfoText}>{classItem.credits} Credits</Text>
            </View>
          </View>
          {renderRoomBadge(classItem)}
          {renderArrowButton()}
        </View>
        {renderCompletion(classItem)}
        {renderStats(classItem)}
        {renderActions(classItem)}
        {renderAssessment(classItem)}
      </TouchableOpacity>
    );
  };

  const renderWeeklyPlanner = () => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
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

    // Helper to extract time HH:mm:ss from ISO string
    const getComparisonTime = (isoString) => {
      if (!isoString) return '';
      // Extract the time part from "1970-01-01T09:00:00.000Z"
      const timePart = isoString.split('T')[1]?.split('.')[0]; // "09:00:00"
      return timePart;
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
                    const classAtTime = dayClasses.find(c => getComparisonTime(c.startTime) === slot.startTime);

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


  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchScheduleData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Schedule &</Text>
            <Text style={styles.headerTitle}>Classes</Text>
            <Text style={styles.semesterInfo}>Academic Year 2026 • Term 2</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton} onPress={() => setNotificationVisible(true)}>
            <Ionicons name="notifications-outline" size={24} color={colors.textWhite} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'subjects' && styles.tabActive]} onPress={() => handleTabChange('subjects')}>
            <Text style={[styles.tabText, activeTab === 'subjects' && styles.tabTextActive]}>My Subjects</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'planner' && styles.tabActive]} onPress={() => handleTabChange('planner')}>
            <Text style={[styles.tabText, activeTab === 'planner' && styles.tabTextActive]}>Weekly Planner</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'subjects' && (
          <View style={styles.classesContainer}>
            {classData.map((classItem, index) => renderClassCard(classItem, index))}
          </View>
        )}

        {activeTab === 'planner' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.plannerContainer}>
              {Object.keys(weeklySchedule).length > 0 ? (
                renderWeeklyPlanner()
              ) : (
                <Text style={styles.plannerPlaceholder}>No schedule data available</Text>
              )}
            </View>

            {/* Teaching Summary Section */}
            <View style={styles.summarySection}>
              <Text style={styles.sectionHeading}>Weekly Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Weekly Load</Text>
                  <Text style={styles.summaryValueGreen}>{dynamicStats.weeklyLoad}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Weekly Classes</Text>
                  <Text style={styles.summaryValuePeach}>{dynamicStats.totalClasses}</Text>
                </View>
              </View>

              <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Daily Breakdown</Text>
              <View style={styles.dailyGrid}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                  <View key={day} style={styles.dailyStatCard}>
                    <Text style={styles.dailyDayName}>{day.substring(0, 3)}</Text>
                    <View style={styles.dailyStatContent}>
                      <View style={styles.dailyStatItem}>
                        <Text style={styles.dailyStatValue}>{dynamicStats.dayStats[day].hours}</Text>
                        <Text style={styles.dailyStatLabel}>HRS</Text>
                      </View>
                      <View style={styles.dailyStatDivider} />
                      <View style={styles.dailyStatItem}>
                        <Text style={styles.dailyStatValue}>{dynamicStats.dayStats[day].classes}</Text>
                        <Text style={styles.dailyStatLabel}>CLASS</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Faculty Spotlight Section */}
            <View style={styles.spotlightSection}>
              <Text style={styles.sectionHeading}>Faculty Spotlight</Text>
              <Text style={styles.spotlightText}>
                Latest university guidelines for 2026 Lab assessments have been published.
              </Text>
              <TouchableOpacity style={styles.spotlightLink}>
                <Text style={styles.spotlightLinkText}>Read Guidelines </Text>
                <Ionicons name="open-outline" size={14} color={colors.primaryGreen} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <Notification visible={isNotificationVisible} onClose={() => setNotificationVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  headerLeft: {
    flex: 1,
  },
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
  tabActive: {
    backgroundColor: colors.primaryPeach,
  },
  tabText: {
    color: colors.textGrey,
    fontSize: typography.body2,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '700',
  },

  classesContainer: {
    gap: 16,
  },
  plannerContainer: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 24,
    minHeight: 200,
    width: '100%',
    overflow: 'hidden',
  },
  plannerPlaceholder: {
    color: colors.textGrey,
    fontSize: 16,
    fontWeight: '600',
  },
  tabContentContainer: {
    flex: 1,
    width: '100%',
  },
  classCard: {
    backgroundColor: colors.surface,
    borderRadius: 32,
    padding: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  featuredCard: {
    backgroundColor: colors.primaryGreen,
    borderWidth: 0,
  },

  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  activeSessionBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeSessionText: {
    color: colors.primaryGreen,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  cardTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tagAndTitle: {
    flex: 1,
  },

  classTitle: {
    color: colors.textWhite,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },
  classTitleFeatured: {
    color: '#000000',
  },
  cardSubtitle: {
    color: colors.textGrey,
    fontSize: 14,
    marginTop: 4,
  },
  cardSubtitleFeatured: {
    color: 'rgba(0, 0, 0, 0.7)',
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
  roomBadgeFeatured: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderColor: 'transparent',
  },
  roomBadgeLab: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.35)',
    borderWidth: 2,
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
  roomLabelFeatured: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  roomNumber: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 0,
  },
  roomNumberFeatured: {
    color: '#000000',
  },

  completionSection: {
    marginBottom: 14,
  },
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
  completionLabelFeatured: {
    color: 'rgba(0, 0, 0, 0.7)',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primaryGreen,
    borderRadius: 4,
  },
  progressBarFeatured: {
    backgroundColor: '#000000',
  },
  percentageText: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
  },
  percentageTextFeatured: {
    color: '#000000',
  },

  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: colors.textGrey,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statLabelFeatured: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  statValue: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '800',
  },
  statValueFeatured: {
    color: '#000000',
  },

  actionsSection: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 0,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    gap: 8,
  },
  actionButtonFeatured: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  actionTextFeatured: {
    color: '#000000',
  },

  assessmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 24,
    marginTop: 0,
    gap: 12,
    borderWidth: 1,
    borderColor: '#3A2A22',
  },
  assessmentInfoFeatured: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderColor: 'transparent',
  },
  assessmentText: {
    color: '#FFAE88',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  assessmentTextFeatured: {
    color: '#000000',
  },

  summarySection: {
    marginTop: 32,
  },
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
  summaryLabel: {
    color: colors.textGrey,
    fontSize: 14,
  },
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
  summaryValueWhite: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },

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
    fontWeight: '700',
  },
  
  plannerContent: {
    gap: 24,
  },
  daySchedule: {
    marginBottom: 8,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  dayName: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  classCount: {
    color: colors.textGrey,
    fontSize: 12,
    fontWeight: '600',
  },
  dayClassesContainer: {
    gap: 10,
  },
  weeklyClassItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timeSlot: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  timeText: {
    color: colors.primaryGreen,
    fontSize: 12,
    fontWeight: '700',
  },
  classInfo: {
    flex: 1,
  },
  weeklyClassName: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  weeklyClassBatch: {
    color: colors.textGrey,
    fontSize: 12,
    marginBottom: 2,
  },
  weeklyClassRoom: {
    color: colors.textGrey,
    fontSize: 12,
  },
  noClassesContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
  },
  noClassesText: {
    color: colors.textGrey,
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Grid Planner Styles
  plannerGridContainer: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 10,
  },
  gridRow: {
    flexDirection: 'row',
  },
  timeColumnHeader: {
    width: 50,
    height: 40,
  },
  dayColumnHeader: {
    width: 90,
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
  timeCell: {
    width: 50,
    height: 85,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.05)',
  },
  timeCellText: {
    color: colors.textGrey,
    fontSize: 10,
    fontWeight: '600',
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
  dayColumnHeaderFixed: {
    width: 60,
    height: 40,
  },
  timeHeaderCell: {
    width: 100,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
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
  dailyStatItem: {
    alignItems: 'center',
  },
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

  // Fixed Day Column Layout
  plannerGridWrapper: {
    flexDirection: 'row',
    flex: 1,
  },
  fixedDayColumn: {
    width: 60,
    backgroundColor: colors.surface,
    zIndex: 10,
    borderRightWidth: 2,
    borderRightColor: 'rgba(255,255,255,0.05)',
  },
  scrollableContent: {
    flex: 1,
  },
});
