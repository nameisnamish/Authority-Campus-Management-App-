import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, ActivityIndicator, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { Teacher_dashboard_API_ROUTES } from '../lib/constants';
import { useCache } from '../hooks/useCache';
import { DATA_SCHEMAS } from '../lib/dataSchemas';
import { normalizeTodayScheduleData } from '../utils/dataNormalizers';
import { getAccessToken } from '../utils/tokenStorage';
import Notification from '../components/Notification';

export default function TeacherDashboardPage({ navigation }) {
  // Cache hook
  const { getCachedData, setCachedData } = useCache();

  // State Management
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'completed'
  const [isNotificationVisible, setNotificationVisible] = useState(false);

  // Animation Values
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const liveCardScale = useRef(new Animated.Value(0.95)).current;
  const liveCardFade = useRef(new Animated.Value(0)).current;
  const listItemsFade = useRef(new Animated.Value(0)).current;
  const listItemsSlide = useRef(new Animated.Value(20)).current;

  // Classify classes into live / upcoming / completed using the full ISO timestamps
  // from the API (e.g. "2026-05-02T03:30:00.000Z"). Direct Date comparison is correct
  // because the API sends real dated UTC times, not epoch-based time-of-day stubs.
  const classifyClasses = (schedule, now) => {
    if (!schedule || schedule.length === 0) return { live: null, upcoming: [], completed: [] };

    let liveClass = null;
    const upcomingClasses = [];
    const completedClasses = [];

    schedule.forEach(classItem => {
      const startTime = new Date(classItem.timings?.startTime);
      const endTime   = new Date(classItem.timings?.endTime);

      if (now >= startTime && now <= endTime) {
        liveClass = classItem;
      } else if (now < startTime) {
        upcomingClasses.push(classItem);
      } else if (now > endTime) {
        completedClasses.push(classItem);
      }
    });

    // Sort upcoming ascending by start time
    upcomingClasses.sort((a, b) =>
      new Date(a.timings?.startTime) - new Date(b.timings?.startTime)
    );

    // Sort completed descending by end time (most recent first)
    completedClasses.sort((a, b) =>
      new Date(b.timings?.endTime) - new Date(a.timings?.endTime)
    );

    return { live: liveClass, upcoming: upcomingClasses, completed: completedClasses };
  };

  // Update current time every minute and when app comes to foreground
  useEffect(() => {
    // Initial fetch to make sure time is right when first rendered
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        setCurrentTime(new Date());
      }
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Check cache first
        const cachedSchedule = getCachedData(
          DATA_SCHEMAS.TODAY_SCHEDULE.cacheKey
        );

        if (cachedSchedule) {
          // Use cached data
          const { schedule, meta } = cachedSchedule;
          if (!schedule || schedule.length === 0) {
            setDashboardData({
              profile: { fullName: 'Teacher', department: '', profileImage: null, status: 'ACTIVE' },
              todaySchedule: [],
              meta: meta
            });
            setCompletedClasses([]);
          } else {
            setDashboardData({
              profile: { fullName: 'Teacher', department: '', profileImage: null, status: 'ACTIVE' },
              todaySchedule: schedule,
              meta: meta
            });
          }
          setLoading(false);
          return;
        }

        // 2. Not in cache, fetch from API
        const url = Teacher_dashboard_API_ROUTES.TEACHER_DASHBOARD;
        const token = getAccessToken();

        console.log('📡 Fetching dashboard with JWT token:', token ? '✅ Present' : '❌ Missing');
        console.log('🔗 API URL:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'User-Agent': 'ReactNative',
            'Authorization': `Bearer ${token}`,
          }
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const responseText = await response.text();
        const data = JSON.parse(responseText);
        console.log('📦 API Response Data:', data);

        // Normalize before caching
        const normalizedData = normalizeTodayScheduleData(data);

        // 3. Cache the normalized data
        setCachedData(
          DATA_SCHEMAS.TODAY_SCHEDULE.cacheKey,
          normalizedData
        );

        if (!data.todaySchedule || data.todaySchedule.length === 0) {
          setDashboardData({
            ...data,
            todaySchedule: []
          });
          setCompletedClasses([]);
        } else {
          setDashboardData(data);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          setError('Request timeout - server took too long to respond');
        } else {
          setError(err.message || 'Network request failed');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Trigger animations when data loads
  useEffect(() => {
    if (!loading && dashboardData) {
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(headerFade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(headerSlide, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(liveCardScale, {
            toValue: 1,
            tension: 60,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(liveCardFade, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(listItemsFade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(listItemsSlide, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [loading, dashboardData]);


  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primaryPeach} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }]}>
          <Text style={{ color: colors.textWhite, fontSize: 16, marginBottom: 10 }}>Failed to load dashboard</Text>
          <Text style={{ color: colors.textGrey, fontSize: 14, textAlign: 'center' }}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Classify classes based on current time
  const { live: liveClass, upcoming: upcomingClasses, completed: completedClasses } =
    classifyClasses(dashboardData?.todaySchedule, currentTime);

  // Determine if there are no classes today (weekend or no schedule)
  const hasNoClasses = !dashboardData?.todaySchedule || dashboardData.todaySchedule.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Hello,{'\n'}{dashboardData?.profile?.fullName?.split(' ')[0]}</Text>
            <View style={styles.deptBadge}>
              <Ionicons name="ribbon-outline" size={14} color={colors.primaryPeach} />
              <Text style={styles.subGreeting}>{dashboardData?.profile?.department}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => setNotificationVisible(true)}>
              <Ionicons name="notifications-outline" size={28} color={colors.textWhite} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarContainer} onPress={() => navigation.navigate('TeacherProfilePage')} activeOpacity={0.85}>
              <Ionicons name="person-circle" size={48} color={colors.primaryPeach} />
              <View style={styles.statusDot} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: headerFade, transform: [{ translateY: headerSlide }] }}>
          <Text style={styles.motivationText}>Let's manage today's classes!</Text>

          <View style={styles.tabFilters}>
            <TouchableOpacity
              style={[styles.filterButton, activeTab === 'upcoming' && styles.filterActive]}
              onPress={() => setActiveTab('upcoming')}
            >
              <Text style={[styles.filterText, activeTab === 'upcoming' && styles.filterTextActive]}>Upcoming</Text>
              <View style={[styles.badgeActive, activeTab !== 'upcoming' && styles.badgeInactive]}>
                <Text style={[styles.badgeTextActive, activeTab !== 'upcoming' && styles.badgeTextInactive]}>
                  {upcomingClasses.length || 0}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, activeTab === 'completed' && styles.filterActive]}
              onPress={() => setActiveTab('completed')}
            >
              <Text style={[styles.filterText, activeTab === 'completed' && styles.filterTextActive]}>Completed</Text>
              <View style={[styles.badgeActive, activeTab !== 'completed' && styles.badgeInactive]}>
                <Text style={[styles.badgeTextActive, activeTab !== 'completed' && styles.badgeTextInactive]}>
                  {completedClasses.length}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {hasNoClasses ? (
          <View style={[styles.noClassesContainer, { paddingVertical: 60 }]}>
            <Ionicons name="calendar-outline" size={64} color={colors.primaryPeach} />
            <Text style={styles.noClassesTitle}>No Classes Today</Text>
            <Text style={styles.noClassesSubtitle}>
              {"No classes scheduled for today."}
            </Text>
          </View>
        ) : (
          <>
            {activeTab === 'upcoming' ? (
              <>
                {liveClass && (
                  <Animated.View style={[styles.liveCard, { opacity: liveCardFade, transform: [{ scale: liveCardScale }] }]}>
                    {/* Decorative shapes background */}
                    <View style={styles.shapeCircle1} />
                    <View style={styles.shapeCircle2} />
                    <View style={styles.shapeSquare1} />
                    <View style={styles.shapeCircle3} />
                    <View style={styles.shapeSquare2} />
                    <View style={styles.shapeCircle4} />
                    <View style={styles.shapeSquare3} />
                    <View style={styles.shapeCircle5} />

                    <View style={styles.liveHeader}>
                      <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveBadgeText}>LIVE NOW</Text>
                      </View>
                    </View>

                    <View style={styles.liveContent}>
                      <View style={styles.liveTextContainer}>
                        <Text style={styles.liveTitle}>{liveClass.subjectName.split(' ').slice(0, 2).join(' ')}</Text>
                        {liveClass.subjectName.split(' ').slice(2).join(' ') && (
                          <Text style={styles.liveTitle}>{liveClass.subjectName.split(' ').slice(2).join(' ')}</Text>
                        )}
                        <Text style={styles.liveSubtitle}>{liveClass.batch} • {liveClass.room}</Text>
                        <Text style={styles.liveStats}>Class Strength: {liveClass.classStrength}</Text>
                        <Text style={styles.liveStats}>Time: {liveClass.timings?.startLabel} - {liveClass.timings?.endLabel}</Text>
                      </View>
                      <View style={styles.laptopIcon}>
                        <View style={styles.shapeSmallSquare} />
                        <View style={styles.shapeSmallCircleTop} />
                        <View style={styles.laptopScreen} />
                        <View style={styles.laptopBase} />
                        <View style={styles.shapeSmallCircleBottom} />
                        <View style={styles.shapeSmallSquareLeft} />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.swipeButton}
                      onPress={() => {
                        console.log('🚀 Navigating to ClassroomScan with:', {
                          timetableId: liveClass.id,
                          subjectName: liveClass.subjectName,
                          batch: liveClass.batch
                        });
                        navigation.navigate('ClassroomScan', {
                          timetableId: liveClass.id,
                          subjectName: liveClass.subjectName,
                          batch: liveClass.batch
                        });
                      }}
                    >
                      <Ionicons name="scan-outline" size={24} color={colors.textWhite} style={styles.swipeIcon} />
                      <Text style={styles.swipeText}>Swipe to Scan Classroom</Text>
                      <Ionicons name="arrow-forward" size={20} color={colors.textWhite} style={styles.swipeArrow} />
                    </TouchableOpacity>
                  </Animated.View>
                )}

                {!liveClass && upcomingClasses.length === 0 && (
                  <View style={[styles.noLiveClassContainer, { minHeight: 400 }]}>
                    <Ionicons name="information-circle-outline" size={48} color={colors.primaryPeach} />
                    <Text style={styles.noLiveClassText}>No Live Class</Text>
                    <Text style={styles.noLiveClassSubtext}>All classes for today are completed</Text>
                  </View>
                )}

                {/* Upcoming Classes Section */}
                {upcomingClasses.length > 0 && (
                  <Animated.View style={{ opacity: listItemsFade, transform: [{ translateY: listItemsSlide }] }}>
                    <Text style={styles.sectionTitle}>Upcoming Classes</Text>
                    {upcomingClasses.map((classItem, index) => (
                      <View key={classItem.id} style={styles.upcomingCard}>
                        <View style={styles.cardInfo}>
                          <View style={styles.tagNext}>
                            <Text style={styles.tagTextNext}>{index === 0 ? 'NEXT' : 'UPCOMING'}</Text>
                          </View>
                          <Text style={styles.courseTag}>{classItem.subjectCode}</Text>
                          <Text style={styles.courseTitle}>{classItem.subjectName}</Text>
                          <Text style={styles.courseSubtitle}>{classItem.section} • {classItem.room}</Text>
                        </View>
                        <View style={styles.timeBox}>
                          <Ionicons name="time-outline" size={14} color={colors.primaryPeach} />
                          <Text style={styles.timeRangeText}>{classItem.timings?.startLabel}</Text>
                          <Text style={styles.timeSeperatorText}>-</Text>
                          <Text style={styles.timeRangeText}>{classItem.timings?.endLabel}</Text>
                        </View>
                      </View>
                    ))}
                  </Animated.View>
                )}
              </>
            ) : (
              <>
                {/* Completed Classes Section - Tab Content */}
                {completedClasses.length > 0 ? (
                  <View style={{ marginTop: 8 }}>
                    {completedClasses.map((classItem) => (
                      <View key={classItem.id} style={[styles.upcomingCard, styles.completedCard]}>
                        <View style={styles.cardInfo}>
                          <View style={styles.tagCompleted}>
                            <Text style={styles.tagTextCompleted}>COMPLETED</Text>
                          </View>
                          <Text style={styles.courseTag}>{classItem.subjectCode}</Text>
                          <Text style={styles.courseTitle}>{classItem.subjectName}</Text>
                          <Text style={styles.courseSubtitle}>{classItem.section} • {classItem.room}</Text>
                        </View>
                        <View style={[styles.timeBox, styles.timeBoxCompleted]}>
                          <Ionicons name="checkmark-done-circle" size={14} color={colors.primaryGreen} />
                          <Text style={[styles.timeRangeText, styles.timeTextCompleted]}>
                            {classItem.timings?.startLabel}
                          </Text>
                          <Text style={[styles.timeSeperatorText, styles.timeTextCompleted]}>-</Text>
                          <Text style={[styles.timeRangeText, styles.timeTextCompleted]}>
                            {classItem.timings?.endLabel}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={[styles.noLiveClassContainer, { minHeight: 400 }]}>
                    <Ionicons name="checkmark-done" size={48} color={colors.primaryGreen} />
                    <Text style={styles.noLiveClassText}>No Completed Classes</Text>
                    <Text style={styles.noLiveClassSubtext}>You haven't completed any classes yet</Text>
                  </View>
                )}
              </>
            )}
          </>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    color: colors.textWhite,
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 44,
  },
  deptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  subGreeting: {
    color: colors.textGrey,
    fontSize: typography.body2,
    marginLeft: 6,
  },
  avatarContainer: {
    position: 'relative',
    marginTop: 6,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    backgroundColor: colors.primaryGreen,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.background,
  },
  motivationText: {
    color: colors.textWhite,
    fontSize: typography.h4,
    fontWeight: '700',
    marginBottom: 24,
  },
  tabFilters: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterActive: {
    backgroundColor: colors.primaryPeach,
    borderColor: colors.primaryPeach,
  },
  filterText: {
    color: colors.textGrey,
    fontWeight: '600',
    marginRight: 8,
  },
  filterTextActive: {
    color: colors.darkOverlay,
  },
  badgeActive: {
    backgroundColor: colors.darkOverlay,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextActive: {
    color: colors.primaryPeach,
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeInactive: {
    backgroundColor: colors.border,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextInactive: {
    color: colors.textGrey,
    fontSize: 10,
    fontWeight: 'bold',
  },
  liveCard: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 30,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  liveHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4B4B',
    marginRight: 6,
  },
  liveBadgeText: {
    color: '#FF4B4B',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  liveContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  liveTextContainer: {
    flex: 1,
  },
  liveTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.darkOverlay,
    lineHeight: 36,
  },
  liveSubtitle: {
    fontSize: typography.body2,
    color: colors.darkOverlay,
    marginTop: 8,
    fontWeight: '600',
  },
  liveStats: {
    fontSize: typography.body2,
    color: '#2b3d30',
    marginTop: 4,
    fontWeight: '500',
  },
  laptopIcon: {
    marginLeft: 10,
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: 120,
    height: 100,
  },
  laptopScreen: {
    width: 100,
    height: 75,
    backgroundColor: colors.textWhite,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.darkOverlay,
    marginBottom: -12,
    zIndex: 1,
  },
  laptopBase: {
    width: 120,
    height: 12,
    backgroundColor: colors.darkOverlay,
    borderRadius: 6,
    zIndex: 2,
    marginTop: 0,
  },
  swipeButton: {
    backgroundColor: colors.darkOverlay,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  swipeIcon: {
    backgroundColor: colors.textWhite,
    color: colors.darkOverlay,
    padding: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  swipeText: {
    color: colors.textWhite,
    fontSize: typography.body2,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  swipeArrow: {
    marginLeft: 'auto',
    marginRight: 10,
  },
  upcomingCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardInfo: {
    flex: 1,
  },
  tagNext: {
    backgroundColor: colors.primaryPeach,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  tagTextNext: {
    color: colors.darkOverlay,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  courseTag: {
    color: colors.textGrey,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  courseTitle: {
    color: colors.textWhite,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 4,
  },
  courseSubtitle: {
    color: colors.textGrey,
    fontSize: typography.caption,
  },
  timeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'nowrap',
    minWidth: 'auto',
  },
  timeRangeText: {
    color: colors.textWhite,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  timeSeperatorText: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: '600',
  },
  recentUpdatesCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  updateTitle: {
    color: colors.textWhite,
    fontSize: typography.body1,
    fontWeight: '700',
  },
  updateLink: {
    color: colors.primaryGreen,
    fontSize: typography.body2,
    fontWeight: '600',
  },
  updateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#3D312B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  updateItemTitle: {
    color: colors.textWhite,
    fontSize: typography.body2,
    fontWeight: '600',
    marginBottom: 2,
  },
  updateItemSub: {
    color: colors.textGrey,
    fontSize: typography.caption,
  },
  // Decorative shapes for liveCard background
  shapeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -100,
    right: -100,
  },
  shapeCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    bottom: 40,
    left: -15,
    zIndex: 0,
  },
  shapeCircle3: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    top: 50,
    right: 20,
    zIndex: 0,
  },
  shapeSquare1: {
    position: 'absolute',
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    bottom: 15,
    right: 25,
    transform: [{ rotate: '45deg' }],
    zIndex: 0,
  },
  shapeSquare2: {
    position: 'absolute',
    width: 35,
    height: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    top: 120,
    left: 10,
    transform: [{ rotate: '30deg' }],
    zIndex: 0,
  },
  shapeCircle4: {
    position: 'absolute',
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
    bottom: 80,
    right: 40,
    zIndex: 0,
  },
  shapeSquare3: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    top: 20,
    left: 30,
    transform: [{ rotate: '60deg' }],
    zIndex: 0,
  },
  shapeCircle5: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    bottom: 5,
    left: 50,
    zIndex: 0,
  },
  shapeSmallSquare: {
    position: 'absolute',
    width: 22,
    height: 22,
    backgroundColor: colors.primaryGreen,
    top: -8,
    left: -8,
    borderRadius: 4,
    opacity: 0.9,
  },
  shapeSmallCircleTop: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryPeach,
    top: -10,
    right: -10,
  },
  shapeSmallCircleBottom: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFE169',
    bottom: -8,
    right: -8,
  },
  shapeSmallSquareLeft: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: colors.primaryGreen,
    bottom: 15,
    left: -12,
    borderRadius: 4,
    opacity: 0.85,
  },
  sectionTitle: {
    color: colors.textWhite,
    fontSize: typography.h4,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 8,
  },
  tagCompleted: {
    backgroundColor: colors.primaryGreen,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  tagTextCompleted: {
    color: colors.darkOverlay,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  completedCard: {
  },
  timeBoxCompleted: {
    borderColor: colors.primaryGreen,
  },
  timeTextCompleted: {
    color: colors.primaryGreen,
  },
  noClassesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  noClassesTitle: {
    color: colors.textWhite,
    fontSize: typography.h3,
    fontWeight: '700',
    marginTop: 16,
  },
  noClassesSubtitle: {
    color: colors.textGrey,
    fontSize: typography.body2,
    marginTop: 8,
    textAlign: 'center',
  },
  noLiveClassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    paddingVertical: 60,
  },
  noLiveClassText: {
    color: colors.textWhite,
    fontSize: typography.body1,
    fontWeight: '700',
    marginTop: 12,
  },
  noLiveClassSubtext: {
    color: colors.textGrey,
    fontSize: typography.body2,
    marginTop: 4,
  },
});
