import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, LayoutAnimation, Platform, UIManager, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import Notification from '../components/Notification';
import { AuthContext } from '../context/AuthContext';
import { useCache } from '../hooks/useCache';
import { Student_Attendance_Report_API_ROUTES } from '../lib/constants';
import { generateCalendarWeeks, getMonthName, formatDate, getDayName } from '../utils/calendarHelper';
import { getAccessToken } from '../utils/tokenStorage';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Helper to generate mock subtopics ────────────────────────────────────────
const generateSubtopics = (moduleId, count, completedCount, isCurrent) => {
  return Array.from({ length: count }, (_, i) => {
    let status = 'pending';
    if (i < completedCount) status = 'completed';
    else if (i === completedCount && isCurrent) status = 'current';
    
    return {
      id: `${moduleId}-${i}`,
      title: `Subtopic ${i + 1}: Extended learning content for section ${i + 1}`,
      status
    };
  });
};

// ─── Mock Syllabus Data (Dense) ───────────────────────────────────────────────
const MOCK_SYLLABUS = [
  {
    id: '1',
    title: 'Process Management',
    description: 'Deep dive into scheduling algorithms, PCB structure, and kernel mechanisms.',
    progress: 100,
    masteryScore: 92,
    lastScore: 88,
    totalTestsTaken: 4,
    subtopics: generateSubtopics('1', 20, 20, false)
  },
  {
    id: '2',
    title: 'Memory Management',
    description: 'Strategic allocation, protection, and virtual memory resource handling.',
    progress: 45,
    masteryScore: 68,
    lastScore: 68,
    totalTestsTaken: 1,
    subtopics: generateSubtopics('2', 20, 9, true)
  },
  {
    id: '3',
    title: 'File Systems',
    description: 'Disk structures, directory implementation, and allocation methods like FAT/NTFS.',
    progress: 0,
    masteryScore: 0,
    lastScore: null,
    totalTestsTaken: 0,
    subtopics: generateSubtopics('3', 20, 0, false)
  },
  {
    id: '4',
    title: 'I/O Systems & Security',
    description: 'Hardware interfaces, kernel I/O subsystem, and protection mechanisms.',
    progress: 0,
    masteryScore: 0,
    lastScore: null,
    totalTestsTaken: 0,
    subtopics: generateSubtopics('4', 20, 0, false)
  },
  {
    id: '5',
    title: 'Distributed Systems',
    description: 'Network operating systems, remote services, and synchronization.',
    progress: 0,
    masteryScore: 0,
    lastScore: null,
    totalTestsTaken: 0,
    subtopics: generateSubtopics('5', 20, 0, false)
  }
];

export default function StudentSyllabusLearningPathPage({ route, navigation }) {
  const { subject, initialTab } = route.params || {};
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(initialTab || 'syllabus');
  const [expandedModule, setExpandedModule] = useState('2'); // Default expand in-progress one
  const [isNotificationVisible, setNotificationVisible] = useState(false);
  
  // Attendance State
  const [attendanceData, setAttendanceData] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  
  const { getCachedData, setCachedData } = useCache();

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceData();
    }
  }, [activeTab, currentMonth, currentYear]);

  const fetchAttendanceData = async () => {
    const studentId = user?.studentId || user?.id;
    const subjectId = subject?.subjectCode || subject?.id;

    const cacheKey = `studentReport_${studentId}_${subjectId}_${currentMonth}_${currentYear}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
      setAttendanceData(cachedData);
      return;
    }

    try {
      setLoadingAttendance(true);
      setAttendanceError(null);

      const apiUrl = `${Student_Attendance_Report_API_ROUTES.REPORT}?student_id=${studentId}&subject_id=${subjectId}&month=${currentMonth + 1}&year=${currentYear}`;
      const userToken = getAccessToken();
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${userToken}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
      });

      const data = await response.json();

      if (data.success) {
        const transformedData = {
          stats: data.data.stats,
          calendar: data.data.calendar,
        };
        setAttendanceData(transformedData);
        setCachedData(cacheKey, transformedData);
      } else {
        setAttendanceError(data.message || 'Failed to fetch data');
      }
    } catch (err) {
      setAttendanceError('Unable to connect to server');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleTabChange = (tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const toggleModule = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedModule(expandedModule === id ? null : id);
  };

  const handleBack = () => navigation.goBack();

  // ─── Renderers for Syllabus ──────────────────────────────────────────────────
  
  const renderModuleCard = (module) => {
    const isExpanded = expandedModule === module.id;
    const isCompleted = module.progress === 100;
    const isInProgress = module.progress > 0 && module.progress < 100;

    return (
      <View key={module.id} style={[styles.moduleCard, isExpanded && styles.moduleCardExpanded]}>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => toggleModule(module.id)}
          style={styles.moduleHeader}
        >
          <View style={styles.moduleHeaderLeft}>
            <View style={[
              styles.progressCircle, 
              isCompleted && { borderColor: colors.primaryGreen },
              isInProgress && { borderColor: colors.primaryPeach }
            ]}>
              {isCompleted ? (
                <Ionicons name="checkmark" size={16} color={colors.primaryGreen} />
              ) : (
                <Text style={[styles.progressPercent, isInProgress && { color: colors.primaryPeach }]}>
                  {module.progress}%
                </Text>
              )}
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.moduleTitle} numberOfLines={1}>{module.title}</Text>
              <View style={styles.moduleMetaRow}>
                 <Text style={styles.moduleSubTitle} numberOfLines={1}>{module.description}</Text>
                 {module.masteryScore > 0 && (
                   <View style={styles.headerMasteryBadge}>
                      <Ionicons name="trophy" size={10} color={colors.primaryGreen} />
                      <Text style={styles.headerMasteryText}>{module.masteryScore}%</Text>
                   </View>
                 )}
              </View>
            </View>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={colors.textGrey} 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* 1. Mastery Status Board (Top of expanded) */}
            <View style={styles.masteryStatusBoard}>
               <View style={styles.masteryHeader}>
                  <Text style={styles.masteryLabel}>MODULE MASTERY</Text>
                  <Text style={[styles.masteryValue, { color: module.masteryScore > 80 ? colors.primaryGreen : colors.primaryPeach }]}>
                     {module.masteryScore}%
                  </Text>
               </View>
               <View style={styles.masteryStatsGrid}>
                  <View style={styles.mGridItem}>
                     <Text style={styles.mGridLabel}>TESTS</Text>
                     <Text style={[styles.mGridValue, { color: colors.primaryPeach }]}>{module.totalTestsTaken}</Text>
                  </View>
                  <View style={styles.mGridItem}>
                     <Text style={styles.mGridLabel}>BEST</Text>
                     <Text style={styles.mGridValue}>{module.masteryScore > 0 ? `${module.masteryScore}%` : '—'}</Text>
                  </View>
                  <View style={styles.mGridItem}>
                     <Text style={styles.mGridLabel}>LAST</Text>
                     <Text style={[styles.mGridValue, { color: colors.textWhite }]}>{module.lastScore ? `${module.lastScore}%` : '—'}</Text>
                  </View>
               </View>
            </View>

            {/* 2. Description & Info */}
            <View style={styles.moduleMeta}>
              <Text style={styles.moduleDescription}>{module.description}</Text>
              <View style={styles.topicsCountRow}>
                <Ionicons name="list" size={14} color={colors.primaryGreen} />
                <Text style={styles.topicsCountText}>{module.subtopics.length} Total Topics</Text>
              </View>
            </View>

            {/* 3. Subtopics List */}
            <Text style={styles.breakdownLabel}>LEARNING STEPS</Text>
            <View style={styles.subtopicsList}>
              {module.subtopics.map((sub, idx) => (
                <View key={sub.id} style={styles.subtopicItem}>
                  <View style={styles.subtopicLeading}>
                    <View style={[
                      styles.subtopicIndicator,
                      sub.status === 'completed' && styles.subIndicatorDone,
                      sub.status === 'current' && styles.subIndicatorCurrent
                    ]}>
                      {sub.status === 'completed' && <Ionicons name="checkmark" size={10} color="#000" />}
                      {sub.status === 'current' && <View style={styles.pulseDot} />}
                    </View>
                    {idx !== module.subtopics.length - 1 && <View style={styles.subConnector} />}
                  </View>
                  <View style={styles.subtopicTextContainer}>
                    <Text style={[
                      styles.subtopicTitle,
                      sub.status === 'completed' && styles.subTitleDone,
                      sub.status === 'current' && styles.subTitleCurrent
                    ]}>
                      {sub.title}
                    </Text>
                    {sub.status === 'current' && (
                      <View style={styles.nowLearningBadge}>
                        <Text style={styles.nowLearningText}>NOW LEARNING</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* 4. Action CTA (Bottom of expanded) */}
            <TouchableOpacity 
              style={styles.actionTestButton}
              activeOpacity={0.8}
            >
               <Ionicons name="flask" size={18} color="#000" />
               <Text style={styles.actionTestText}>Start Practice Test</Text>
               <View style={styles.actionArrowBg}>
                  <Ionicons name="arrow-forward" size={12} color={colors.primaryPeach} />
               </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderSyllabusTab = () => {
    const totalModules = MOCK_SYLLABUS.length;
    const completedModules = MOCK_SYLLABUS.filter(m => m.progress === 100).length;
    const overallProgress = (MOCK_SYLLABUS.reduce((acc, m) => acc + m.progress, 0) / (totalModules * 100)) * 100;

    return (
      <ScrollView contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress Dashboard */}
        <View style={styles.dashboardCard}>
          <View style={styles.dashboardHeader}>
            <View>
              <Text style={styles.dashboardLabel}>SUBJECT PROGRESS</Text>
              <Text style={styles.dashboardValue}>{Math.round(overallProgress)}%</Text>
            </View>
            <View style={styles.dashboardStats}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatValue}>{completedModules}</Text>
                <Text style={styles.miniStatLabel}>DONE</Text>
              </View>
              <View style={styles.miniStatDivider} />
              <View style={styles.miniStat}>
                <Text style={styles.miniStatValue}>{totalModules}</Text>
                <Text style={styles.miniStatLabel}>TOTAL</Text>
              </View>
            </View>
          </View>
          <View style={styles.dashboardProgressBg}>
            <View style={[styles.dashboardProgressFill, { width: `${overallProgress}%` }]} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Syllabus Modules</Text>
        <View style={styles.modulesContainer}>
          {MOCK_SYLLABUS.map(m => renderModuleCard(m))}
        </View>
      </ScrollView>
    );
  };

  // ─── Renderers for Attendance ────────────────────────────────────────────────

  const renderAttendanceTab = () => {
    if (loadingAttendance) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
          <Text style={styles.loadingText}>Fetching attendance details...</Text>
        </View>
      );
    }

    const calendarWeeks = attendanceData ? generateCalendarWeeks(attendanceData.calendar, currentMonth, currentYear) : [];
    const stats = attendanceData?.stats || { overallPercentage: 0, classesAttended: 0, classesMissed: 0 };
    const monthName = getMonthName(currentMonth);

    return (
      <ScrollView contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>OVERALL</Text>
            <View style={styles.statValueRow}>
              <Text style={styles.statHero}>{Math.round(stats.overallPercentage)}%</Text>
              <Text style={styles.statSubText}>Attendance</Text>
            </View>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#AF391E' }]}>
            <Text style={[styles.statLabel, { color: '#FFB8A6' }]}>CLASSES MISSED</Text>
            <Text style={[styles.statHero, { color: '#fff' }]}>{stats.classesMissed}</Text>
          </View>
        </View>

        <View style={styles.calendarWrapper}>
          <View style={styles.calendarHeader}>
            <View>
              <Text style={styles.calendarMonthTitle}>{monthName} {currentYear}</Text>
              <Text style={styles.calendarSubtitle}>Daily Overview</Text>
            </View>
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={() => {
                if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
                else setCurrentMonth(m => m - 1);
              }} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
                else setCurrentMonth(m => m + 1);
              }} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.calendarGrid}>
            <View style={styles.dayLabelsRow}>
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                <Text key={d} style={styles.dayLabel}>{d}</Text>
              ))}
            </View>
            {calendarWeeks.map((week, wi) => (
              <View key={wi} style={styles.calendarRow}>
                {week.map((dayObj, di) => {
                  const isSelected = selectedDate === dayObj.dateStr;
                  let cellStyle = styles.calCell;
                  let textStyle = styles.calText;

                  if (dayObj.status === 'present') {
                    cellStyle = [styles.calCell, styles.calPresent, isSelected && styles.calSelected];
                    textStyle = [styles.calText, { color: colors.primaryGreen }];
                  } else if (dayObj.status === 'absent') {
                    cellStyle = [styles.calCell, styles.calAbsent, isSelected && styles.calSelected];
                    textStyle = [styles.calText, { color: '#FF7050' }];
                  } else if (dayObj.status === 'leave') {
                    cellStyle = [styles.calCell, styles.calLeave, isSelected && styles.calSelected];
                    textStyle = [styles.calText, { color: colors.primaryPeach }];
                  } else if (dayObj.status === 'empty') {
                    cellStyle = [styles.calCell, { opacity: 0 }];
                  }

                  return (
                    <TouchableOpacity 
                      key={di} 
                      style={cellStyle} 
                      disabled={dayObj.status === 'empty'}
                      onPress={() => setSelectedDate(dayObj.dateStr)}
                    >
                      <Text style={textStyle}>{dayObj.day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {selectedDate && (
          <View style={styles.detailCard}>
             <View style={styles.detailHeader}>
                <View style={styles.detailTitleBox}>
                   <View style={styles.statusBar} />
                   <View>
                      <Text style={styles.detailDateText}>{formatDate(selectedDate)}</Text>
                      <Text style={styles.detailDayText}>{getDayName(selectedDate)}</Text>
                   </View>
                </View>
                <View style={styles.calendarIconBg}>
                   <Ionicons name="calendar" size={24} color={colors.primaryPeach} />
                </View>
             </View>
             <Text style={styles.detailSubject}>{subject?.title}</Text>
             <Text style={styles.detailTeacher}>Teacher: {subject?.teacher || 'Dr. Singh'}</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{subject?.title || 'Subject Details'}</Text>
          <View style={styles.headerSubjectBadge}>
             <Text style={styles.headerSubjectCode}>{subject?.subjectCode || 'CS-301'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={() => setNotificationVisible(true)}>
          <Ionicons name="notifications-outline" size={24} color={colors.textWhite} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      {/* Custom Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'syllabus' && styles.tabActive]}
          onPress={() => handleTabChange('syllabus')}
        >
          <Ionicons name="book-outline" size={18} color={activeTab === 'syllabus' ? '#000' : colors.textGrey} />
          <Text style={[styles.tabText, activeTab === 'syllabus' && styles.tabTextActive]}>Syllabus</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'attendance' && styles.tabActive]}
          onPress={() => handleTabChange('attendance')}
        >
          <Ionicons name="calendar-outline" size={18} color={activeTab === 'attendance' ? '#000' : colors.textGrey} />
          <Text style={[styles.tabText, activeTab === 'attendance' && styles.tabTextActive]}>Attendance</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'syllabus' ? renderSyllabusTab() : renderAttendanceTab()}
      </View>

      <Notification visible={isNotificationVisible} onClose={() => setNotificationVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: colors.textWhite,
    fontSize: 32,
    fontWeight: '800',
  },
  headerSubjectBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(163, 230, 178, 0.15)',
    borderRadius: 6,
    marginTop: 2,
  },
  headerSubjectCode: {
    color: colors.primaryGreen,
    fontSize: 10,
    fontWeight: '800',
  },
  profileMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 2,
  },
  profileCircle: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    padding: 6,
    backgroundColor: colors.surface,
    borderRadius: 30,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  tabActive: {
    backgroundColor: colors.primaryPeach,
  },
  tabText: {
    color: colors.textGrey,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '700',
  },

  // Syllabus Content
  tabScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  dashboardCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dashboardLabel: {
    color: colors.textGrey,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dashboardValue: {
    color: colors.textWhite,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
  },
  dashboardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatValue: {
    color: colors.primaryGreen,
    fontSize: 18,
    fontWeight: '800',
  },
  miniStatLabel: {
    color: colors.textGrey,
    fontSize: 9,
    fontWeight: '700',
  },
  miniStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dashboardProgressBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  dashboardProgressFill: {
    height: '100%',
    backgroundColor: colors.primaryGreen,
    borderRadius: 4,
  },

  sectionTitle: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    marginLeft: 4,
  },
  modulesContainer: {
    gap: 12,
  },
  moduleCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  moduleCardExpanded: {
    borderColor: 'rgba(163, 230, 178, 0.2)',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  moduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  progressCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    color: colors.textGrey,
    fontSize: 11,
    fontWeight: '800',
  },
  titleContainer: {
    flex: 1,
  },
  moduleTitle: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  moduleSubTitle: {
    color: colors.textGrey,
    fontSize: 12,
    marginTop: 2,
    flex: 1,
  },
  moduleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    justifyContent: 'space-between',
    width: '100%',
  },
  headerMasteryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(163, 230, 178, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
    marginLeft: 12,
    flexShrink: 0,
  },
  headerMasteryText: {
    color: colors.primaryGreen,
    fontSize: 9,
    fontWeight: '800',
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  moduleMeta: {
    marginBottom: 16,
    paddingTop: 8,
  },
  moduleDescription: {
    color: colors.textGrey,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  topicsCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topicsCountText: {
    color: colors.primaryGreen,
    fontSize: 12,
    fontWeight: '600',
  },
  subtopicsList: {
    paddingLeft: 4,
  },
  subtopicItem: {
    flexDirection: 'row',
    minHeight: 50,
  },
  subtopicLeading: {
    width: 24,
    alignItems: 'center',
  },
  subtopicIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    marginTop: 2,
  },
  subIndicatorDone: {
    backgroundColor: colors.primaryGreen,
    borderColor: colors.primaryGreen,
  },
  subIndicatorCurrent: {
    borderColor: colors.primaryPeach,
    backgroundColor: 'rgba(255, 174, 136, 0.1)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryPeach,
  },
  subConnector: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 2,
    borderRadius: 1,
  },
  subtopicTextContainer: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  subtopicTitle: {
    color: colors.textGrey,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  subTitleDone: {
    color: colors.textWhite,
    opacity: 0.6,
  },
  subTitleCurrent: {
    color: colors.textWhite,
    fontWeight: '700',
  },
  
  // Header Updates
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

  // Mastery Status Board (Top)
  masteryStatusBoard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  masteryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  masteryLabel: {
    color: '#E0E0E0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  masteryValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  masteryStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  mGridItem: {
    alignItems: 'center',
    flex: 1,
  },
  mGridLabel: {
    color: colors.textGrey,
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 2,
  },
  mGridValue: {
    color: colors.primaryGreen,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },

  // Action Button (Bottom)
  actionTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryPeach,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 12,
    gap: 10,
  },
  actionTestText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionArrowBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  breakdownLabel: {
    color: colors.textGrey,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  
  nowLearningBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 174, 136, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  nowLearningText: {
    color: colors.primaryPeach,
    fontSize: 8,
    fontWeight: '900',
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryGreen,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
    gap: 8,
  },
  practiceButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },

  // Attendance (remains consistent)
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statLabel: { color: colors.textGrey, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statHero: { color: colors.primaryGreen, fontSize: 28, fontWeight: '800' },
  statSubText: { color: colors.textGrey, fontSize: 11, fontWeight: '500' },
  calendarWrapper: { backgroundColor: colors.surface, borderRadius: 24, padding: 16, marginBottom: 24 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calendarMonthTitle: { color: colors.textWhite, fontSize: 20, fontWeight: '700' },
  calendarSubtitle: { color: colors.textGrey, fontSize: 12 },
  monthNav: { flexDirection: 'row', gap: 8 },
  navBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  calendarGrid: {},
  dayLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  dayLabel: { width: 40, textAlign: 'center', color: colors.textGrey, fontSize: 10, fontWeight: '700' },
  calendarRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  calCell: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  calPresent: { backgroundColor: 'rgba(163, 230, 178, 0.1)', borderColor: 'rgba(163, 230, 178, 0.3)' },
  calAbsent: { backgroundColor: 'rgba(255, 107, 107, 0.1)', borderColor: 'rgba(255, 107, 107, 0.3)' },
  calLeave: { backgroundColor: 'rgba(255, 174, 136, 0.1)', borderColor: 'rgba(255, 174, 136, 0.3)' },
  calSelected: { borderColor: colors.textWhite, borderWidth: 2 },
  calText: { color: colors.textGrey, fontSize: 14, fontWeight: '600' },
  detailCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  detailTitleBox: { flexDirection: 'row', gap: 12 },
  statusBar: { width: 4, backgroundColor: colors.primaryGreen, borderRadius: 2 },
  detailDateText: { color: colors.textWhite, fontSize: 18, fontWeight: '700' },
  detailDayText: { color: colors.textGrey, fontSize: 12, fontWeight: '600' },
  calendarIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255, 174, 136, 0.1)', justifyContent: 'center', alignItems: 'center' },
  detailSubject: { color: colors.textWhite, fontSize: 16, fontWeight: '600', marginBottom: 4 },
  detailTeacher: { color: colors.textGrey, fontSize: 13 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { color: colors.textGrey, marginTop: 12, fontSize: 14 },
});
