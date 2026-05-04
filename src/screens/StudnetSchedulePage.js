import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import Notification from '../components/Notification';

// ─── Static mock data (student perspective) ───────────────────────────────────
const MOCK_DATA_BY_SEM = {
  1: [
    {
      id: 's1-1',
      title: 'Mathematics I',
      tag: 'Batch B',
      sectionName: 'Section A',
      subjectCode: 'MA-101',
      subjectType: 'Core',
      credits: 4,
      room: '101',
      roomLabel: 'Room',
      roomIcon: 'calculator-outline',
      attendance: 95,
      teacher: 'Dr. Singh',
      nextClass: 'Completed',
    },
    {
      id: 's1-2',
      title: 'Physics',
      tag: 'Batch B',
      sectionName: 'Section A',
      subjectCode: 'PH-101',
      subjectType: 'Core',
      credits: 4,
      room: 'Lab 1',
      roomLabel: 'Lab',
      roomIcon: 'flask-outline',
      attendance: 88,
      teacher: 'Prof. Das',
      nextClass: 'Completed',
    },
  ],
  2: [],
  3: [
    {
      id: 's3-1',
      title: 'Digital Logic Design',
      tag: 'Batch B',
      sectionName: 'Section A',
      subjectCode: 'CS-201',
      subjectType: 'Core',
      credits: 3,
      room: '305',
      roomLabel: 'Room',
      roomIcon: 'hardware-chip-outline',
      attendance: 78,
      teacher: 'Prof. Verma',
      nextClass: 'Completed',
    },
    {
      id: 's3-2',
      title: 'Data Structures',
      tag: 'Batch B',
      sectionName: 'Section A',
      subjectCode: 'CS-202',
      subjectType: 'Core',
      credits: 4,
      room: '201',
      roomLabel: 'Room',
      roomIcon: 'list-outline',
      attendance: 82,
      teacher: 'Dr. Khanna',
      nextClass: 'Completed',
    },
  ],
  4: [
    {
      id: '1',
      title: 'Data Structures & Algorithms',
      tag: 'Batch B',
      sectionName: 'Section A',
      subjectCode: 'CS-301',
      subjectType: 'Core',
      credits: 4,
      room: '204',
      roomLabel: 'Room',
      roomIcon: 'server-outline',
      attendance: 82,
      teacher: 'Dr. Mehta',
      nextClass: 'Mon, 10:00 AM',
    },
    {
      id: '2',
      title: 'Operating Systems',
      tag: 'Batch B',
      sectionName: 'Section A',
      subjectCode: 'CS-302',
      subjectType: 'Core',
      credits: 3,
      room: 'Lab 3',
      roomLabel: 'Lab',
      roomIcon: 'desktop-outline',
      attendance: 91,
      teacher: 'Prof. Sharma',
      nextClass: 'Tue, 9:00 AM',
    },
    {
      id: '3',
      title: 'Database Management',
      tag: 'Batch B',
      sectionName: 'Section A',
      subjectCode: 'CS-303',
      subjectType: 'Core',
      credits: 3,
      room: '310',
      roomLabel: 'Room',
      roomIcon: 'server-outline',
      attendance: 67,
      teacher: 'Dr. Kapoor',
      nextClass: 'Wed, 11:00 AM',
    },
    {
      id: '4',
      title: 'Computer Networks',
      tag: 'Batch B',
      sectionName: 'Section A',
      subjectCode: 'CS-304',
      subjectType: 'Elective',
      credits: 3,
      room: '102',
      roomLabel: 'Room',
      roomIcon: 'wifi-outline',
      attendance: 75,
      teacher: 'Prof. Nair',
      nextClass: 'Thu, 2:00 PM',
    },
    {
      id: '5',
      title: 'Machine Learning',
      tag: 'Batch B',
      sectionName: 'Section A',
      subjectCode: 'CS-401',
      subjectType: 'Elective',
      credits: 4,
      room: 'Lab 1',
      roomLabel: 'Lab',
      roomIcon: 'hardware-chip-outline',
      attendance: 88,
      teacher: 'Dr. Rao',
      nextClass: 'Fri, 3:00 PM',
    },
  ],
  5: [],
  6: [],
};

const MOCK_WEEKLY = {
  Monday:    [{ subjectName: 'Data Structures & Algorithms', sectionName: 'Batch B', room: '204',   startTime: '10:00:00' }],
  Tuesday:   [{ subjectName: 'Operating Systems',            sectionName: 'Batch B', room: 'Lab 3', startTime: '09:00:00' }],
  Wednesday: [{ subjectName: 'Database Management',          sectionName: 'Batch B', room: '310',   startTime: '11:00:00' }],
  Thursday:  [{ subjectName: 'Computer Networks',            sectionName: 'Batch B', room: '102',   startTime: '14:00:00' }],
  Friday:    [{ subjectName: 'Machine Learning',             sectionName: 'Batch B', room: 'Lab 1', startTime: '15:00:00' }],
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
  const [activeTab, setActiveTab] = useState('subjects');
  const [selectedSemester, setSelectedSemester] = useState(4);
  const [isNotificationVisible, setNotificationVisible] = useState(false);

  const handleTabChange = (tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const handleSemesterChange = (sem) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedSemester(sem);
  };

  // ── Dynamic stats ────────────────────────────────────────────────────────────
  const calculateStats = () => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    let totalClasses = 0;
    const dayStats = {};
    daysOfWeek.forEach((day) => {
      const classes = MOCK_WEEKLY[day] || [];
      dayStats[day] = { classes: classes.length, hours: classes.length };
      totalClasses += classes.length;
    });
    
    const currentSubjects = MOCK_DATA_BY_SEM[selectedSemester] || [];
    const avgAttendance = currentSubjects.length > 0 
      ? Math.round(currentSubjects.reduce((acc, s) => acc + s.attendance, 0) / currentSubjects.length)
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
          <Text style={styles.cardSubtitle}>{item.tag} • {item.sectionName}</Text>
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

                    const dayClasses = MOCK_WEEKLY[day] || [];
                    const classAtTime = dayClasses.find(c => getComparisonTime(c.startTime) === slot.startTime);

                    return (
                      <View key={`${day}-${slot.label}`} style={styles.gridCell}>
                        {classAtTime ? (
                          <View style={styles.gridClassCard}>
                            <Text style={styles.gridClassTitle} numberOfLines={2}>
                              {classAtTime.subjectName || 'Class'}
                            </Text>
                            <Text style={styles.gridClassRoom} numberOfLines={1}>
                              {classAtTime.sectionName || 'Batch B'}
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
    return (
      <View style={styles.semesterSelectorContainer}>
        <Text style={styles.semesterSelectorLabel}>Select Semester</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.semesterScroll}>
          {semesters.map((sem) => (
            <TouchableOpacity
              key={`sem-${sem}`}
              style={[
                styles.semesterButton,
                selectedSemester === sem && styles.semesterButtonActive
              ]}
              onPress={() => handleSemesterChange(sem)}
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

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Schedule &</Text>
            <Text style={styles.headerTitle}>Subjects</Text>
            <Text style={styles.semesterInfo}>Academic Year 2026 • Term 2</Text>
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
              {MOCK_DATA_BY_SEM[selectedSemester] && MOCK_DATA_BY_SEM[selectedSemester].length > 0 ? (
                MOCK_DATA_BY_SEM[selectedSemester].map((item) => renderSubjectCard(item))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="book-outline" size={48} color={colors.textGrey} />
                  <Text style={styles.emptyStateText}>No subjects found for Semester {selectedSemester}</Text>
                </View>
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
                Mid-semester examinations for Term 2 are scheduled for the last week of May 2026. Check your exam timetable on the portal.
              </Text>
              <TouchableOpacity style={styles.spotlightLink}>
                <Text style={styles.spotlightLinkText}>View Exam Schedule </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  semesterButtonActive: {
    backgroundColor: colors.primaryGreen,
    borderColor: colors.primaryGreen,
  },
  semesterButtonText: {
    color: colors.textGrey,
    fontSize: 13,
    fontWeight: '600',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyStateText: {
    color: colors.textGrey,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 40,
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
    fontWeight: '700',
  },
});
