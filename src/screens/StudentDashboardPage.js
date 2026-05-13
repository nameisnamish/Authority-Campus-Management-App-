import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, LayoutAnimation, Modal, Alert, ActivityIndicator, Animated, AppState, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { Student_dashboard_API_ROUTES, Student_schedule_API_ROUTES } from '../lib/constants';
import { getAccessToken } from '../utils/tokenStorage';
import Notification from '../components/Notification';
import { useCache } from '../hooks/useCache';
import { DATA_SCHEMAS } from '../lib/dataSchemas';
import { normalizeStudentScheduleData } from '../utils/dataNormalizers';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  return <Animated.View style={[style, { opacity: animatedValue, backgroundColor: 'rgba(255,255,255,0.06)' }]} />;
};

const DashboardSkeleton = () => (
  <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    {/* Header Skeleton */}
    <View style={[styles.header, { marginBottom: 24 }]}>
      <View style={styles.greetingContainer}>
        <SkeletonPlaceholder style={{ width: 120, height: 32, borderRadius: 8, marginBottom: 8 }} />
        <SkeletonPlaceholder style={{ width: 220, height: 16, borderRadius: 4 }} />
      </View>
      <SkeletonPlaceholder style={{ width: 48, height: 48, borderRadius: 24 }} />
    </View>

    <SkeletonPlaceholder style={{ width: 180, height: 16, marginBottom: 24, borderRadius: 4 }} />

    {/* Tabs Skeleton */}
    <View style={styles.tabFilters}>
      <SkeletonPlaceholder style={{ flex: 1, height: 48, borderRadius: 24 }} />
      <SkeletonPlaceholder style={{ flex: 1, height: 48, borderRadius: 24 }} />
    </View>

    {/* Live Card Skeleton */}
    <View style={[styles.liveCard, { height: 210, backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }]}>
       <SkeletonPlaceholder style={{ width: 90, height: 20, borderRadius: 10, marginBottom: 20 }} />
       <SkeletonPlaceholder style={{ width: '70%', height: 36, borderRadius: 8, marginBottom: 12 }} />
       <SkeletonPlaceholder style={{ width: '50%', height: 18, borderRadius: 4, marginBottom: 24 }} />
       <View style={{ flexDirection: 'row', gap: 12 }}>
          <SkeletonPlaceholder style={{ width: 110, height: 44, borderRadius: 22 }} />
          <SkeletonPlaceholder style={{ width: 110, height: 44, borderRadius: 22 }} />
       </View>
    </View>

    {/* Subjects Skeleton */}
    <View style={{ marginTop: 32 }}>
      <SkeletonPlaceholder style={{ width: 140, height: 22, marginBottom: 18, borderRadius: 4 }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
         {[1, 2, 3].map(i => (
           <SkeletonPlaceholder key={i} style={{ width: 150, height: 90, borderRadius: 24 }} />
         ))}
      </ScrollView>
    </View>

    {/* Upcoming List Skeleton */}
    <View style={{ marginTop: 36 }}>
       <SkeletonPlaceholder style={{ width: 160, height: 22, marginBottom: 18, borderRadius: 4 }} />
       {[1, 2].map(i => (
         <View key={i} style={[styles.upcomingCard, { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)', borderWidth: 1 }]}>
           <View style={{ flex: 1 }}>
              <SkeletonPlaceholder style={{ width: 70, height: 14, borderRadius: 4, marginBottom: 10 }} />
              <SkeletonPlaceholder style={{ width: '80%', height: 22, borderRadius: 6, marginBottom: 10 }} />
              <SkeletonPlaceholder style={{ width: '60%', height: 14, borderRadius: 4 }} />
           </View>
           <SkeletonPlaceholder style={{ width: 85, height: 42, borderRadius: 12 }} />
         </View>
       ))}
    </View>
  </ScrollView>
);

export default function StudentDashboardPage({ navigation }) {
  const { logout, isLoading, user } = useAuth();
  const { getCachedData, setCachedData, isHydrated } = useCache();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  
  // Use cache immediately for the initial state to prevent flicker on back-navigation
  const cachedDb = getCachedData(DATA_SCHEMAS.STUDENT_DASHBOARD.cacheKey);
  const cachedSubj = getCachedData(DATA_SCHEMAS.DASHBOARD_SUBJECTS.cacheKey);
  
  const [dashboardData, setDashboardData] = useState(cachedDb || null);
  const [loading, setLoading] = useState(!cachedDb);
  const [subjects, setSubjects] = useState(cachedSubj?.subjects || []);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('upcoming');
  const [liveClass, setLiveClass] = useState(null);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [completedClasses, setCompletedClasses] = useState([]);
  const [isNotificationVisible, setNotificationVisible] = useState(false);
  
  // Animation Values
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const liveCardScale = useRef(new Animated.Value(0.95)).current;
  const liveCardFade = useRef(new Animated.Value(0)).current;
  const listItemsFade = useRef(new Animated.Value(0)).current;
  const listItemsSlide = useRef(new Animated.Value(20)).current;

  // Utility: Create today's date with API time
  const createTodayDateFromAPITime = (apiTimeString) => {
    try {
      const apiDate = new Date(apiTimeString);
      const hours = apiDate.getHours();
      const minutes = apiDate.getMinutes();
      const seconds = apiDate.getSeconds();
      
      const today = new Date();
      today.setHours(hours, minutes, seconds, 0);
      return today;
    } catch (err) {
      return new Date();
    }
  };

  // Utility: Classify classes into live, upcoming, completed
  const classifyClasses = (schedule, now) => {
    if (!schedule || schedule.length === 0) {
      return { live: null, upcoming: [], completed: [] };
    }

    let live = null;
    const upcoming = [];
    const completed = [];

    schedule.forEach(classItem => {
      const startTime = createTodayDateFromAPITime(classItem.timings.startTime);
      const endTime = createTodayDateFromAPITime(classItem.timings.endTime);

      if (now >= startTime && now <= endTime) {
        live = classItem;
      } else if (now < startTime) {
        upcoming.push(classItem);
      } else if (now > endTime) {
        completed.push(classItem);
      }
    });

    // Sort upcoming by start time (ascending)
    upcoming.sort((a, b) => 
      createTodayDateFromAPITime(a.timings.startTime) - createTodayDateFromAPITime(b.timings.startTime)
    );

    // Sort completed by end time (descending)
    completed.sort((a, b) => 
      createTodayDateFromAPITime(b.timings.endTime) - createTodayDateFromAPITime(a.timings.endTime)
    );

    return { live, upcoming, completed };
  };

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 0. Check for cached dashboard subjects first (Longer TTL)
        const cachedSubjects = getCachedData(DATA_SCHEMAS.DASHBOARD_SUBJECTS.cacheKey);
        if (cachedSubjects && cachedSubjects.subjects) {
          setSubjects(cachedSubjects.subjects);
          console.log('📦 Loaded dashboard subjects from persistent cache');
        }

        // 0.1 Check for cached full schedule (Short TTL - 5 mins)
        // This is mainly for the Schedule Page, but we check it here too
        const cachedFullSchedule = getCachedData(DATA_SCHEMAS.STUDENT_SCHEDULE.cacheKey);
        if (!cachedSubjects && cachedFullSchedule && cachedFullSchedule.enrolledSubjects?.subjects) {
          setSubjects(cachedFullSchedule.enrolledSubjects.subjects);
        }

        // 0.2 Check for cached dashboard data (Live classes, etc.)
        const cachedDashboard = getCachedData(DATA_SCHEMAS.STUDENT_DASHBOARD.cacheKey);
        if (cachedDashboard) {
          setDashboardData(cachedDashboard);
          setLoading(false); // Can show cached data while revalidating
          console.log('📦 Loaded dashboard from cache');
        }

        const token = getAccessToken();
        const headers = {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'ReactNative',
          'Authorization': `Bearer ${token}`,
        };

        const dashboardUrl = Student_dashboard_API_ROUTES.STUDENT_DASHBOARD;
        const scheduleUrl = Student_schedule_API_ROUTES.STUDENT_SCHEDULE;

        console.log('📡 Fetching Dashboard & Schedule in parallel...');

        const [dashboardResult, scheduleResult] = await Promise.allSettled([
          fetch(dashboardUrl, { method: 'GET', headers }),
          fetch(scheduleUrl, { method: 'GET', headers })
        ]);

        // 1. Handle Dashboard Data (Primary - Current Live Classes)
        if (dashboardResult.status === 'fulfilled' && dashboardResult.value.ok) {
          const data = await dashboardResult.value.json();
          setDashboardData(data.data);
          setCachedData(DATA_SCHEMAS.STUDENT_DASHBOARD.cacheKey, data.data);
          console.log('✅ Dashboard loaded and cached');
        } else {
          const reason = dashboardResult.status === 'rejected' ? dashboardResult.reason : `HTTP ${dashboardResult.value?.status}`;
          console.error('❌ Dashboard API failed:', reason);
          setError('Failed to load dashboard data');
        }

        // 2. Handle Schedule Data (Secondary - Enrolled Subjects)
        if (scheduleResult.status === 'fulfilled' && scheduleResult.value.ok) {
          const result = await scheduleResult.value.json();
          
          // NORMALIZE AND CACHE
          const normalizedData = normalizeStudentScheduleData(result);
          if (normalizedData) {
            // Tier 1: Cache FULL data for Schedule Page (Short 5 min TTL)
            setCachedData(DATA_SCHEMAS.STUDENT_SCHEDULE.cacheKey, normalizedData);
            
            // Tier 2: Cache ONLY subjects for Dashboard (Long 30 min TTL)
            setCachedData(DATA_SCHEMAS.DASHBOARD_SUBJECTS.cacheKey, {
              subjects: normalizedData.enrolledSubjects?.subjects || [],
              fetchedAt: Date.now()
            });

            setSubjects(normalizedData.enrolledSubjects?.subjects || []);
            console.log('✅ Schedule cached (5m) & Dashboard Subjects cached (30m)');
          }
        } else {
          console.warn('⚠️ Schedule API failed, using fallback/empty state');
        }

      } catch (err) {
        console.error('❌ Critical error in parallel fetch:', err);
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Update current time every minute and when app comes to foreground
  useEffect(() => {
    // Initial fetch to make sure time is right when first rendered
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

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

  // Classify classes whenever dashboardData or currentTime changes
  useEffect(() => {
    if (dashboardData && dashboardData.todaySchedule) {
      const { live, upcoming, completed } = classifyClasses(dashboardData.todaySchedule, currentTime);
      setLiveClass(live);
      setUpcomingClasses(upcoming);
      setCompletedClasses(completed);
    }
  }, [dashboardData, currentTime]);

  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!loading && !hasAnimated.current) {
      hasAnimated.current = true;
      Animated.stagger(100, [
        Animated.parallel([
          Animated.timing(headerFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(headerSlide, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(liveCardScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(liveCardFade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(listItemsFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(listItemsSlide, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [loading]);

  const handleTabChange = (tab) => {
    if (activeTab === tab) return;
    
    // Smooth layout transition
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'spring', springDamping: 0.7 },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    
    setActiveTab(tab);
    
    // Reset and restart list animations for a fresh feel
    listItemsFade.setValue(0);
    listItemsSlide.setValue(20);
    
    Animated.parallel([
      Animated.timing(listItemsFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(listItemsSlide, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        console.log('Logout successful');
      } else {
        Alert.alert('Error', result.error || 'Logout failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An error occurred');
    }
  };
  if (loading && !dashboardData) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Hello, {dashboardData?.student?.name?.split(' ')[0] || 'Student'}</Text>
            <Text style={styles.subGreeting} numberOfLines={1} ellipsizeMode="tail">{dashboardData?.student?.institution} • {dashboardData?.student?.program}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => setNotificationVisible(true)}>
              <Ionicons name="notifications-outline" size={28} color={colors.textWhite} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={() => navigation.navigate('StudentProfilePage')}
              activeOpacity={0.7}
            >
              <Ionicons name="person-circle" size={48} color={colors.primaryPeach} />
              <View style={styles.statusDot} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: headerFade, transform: [{ translateY: headerSlide }] }}>
          <Text style={styles.motivationText}>Let's crush today's classes!</Text>

          <View style={styles.tabFilters}>
            <TouchableOpacity 
              style={[styles.filterButton, activeTab === 'upcoming' && styles.filterActive]}
              onPress={() => handleTabChange('upcoming')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, activeTab === 'upcoming' && styles.filterTextActive]}>Upcoming</Text>
              <View style={[styles.badgeActive, activeTab !== 'upcoming' && styles.badgeInactive]}>
                <Text style={[styles.badgeTextActive, activeTab !== 'upcoming' && styles.badgeTextInactive]}>{upcomingClasses.length}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, activeTab === 'completed' && styles.filterActive]}
              onPress={() => handleTabChange('completed')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, activeTab === 'completed' && styles.filterTextActive]}>Completed</Text>
              <View style={[styles.badgeActive, activeTab !== 'completed' && styles.badgeInactive]}>
                <Text style={[styles.badgeTextActive, activeTab !== 'completed' && styles.badgeTextInactive]}>{completedClasses.length}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {activeTab === 'upcoming' ? (
          <>
            <Animated.View style={[styles.liveCard, { opacity: liveCardFade, transform: [{ scale: liveCardScale }] }]} >
          {/* Decorative shapes background */}
          <View style={styles.shapeCircle1} />
          <View style={styles.shapeCircle2} />
          <View style={styles.shapeSquare1} />
          <View style={styles.shapeCircle3} />
          <View style={styles.shapeSquare2} />
          <View style={styles.shapeCircle4} />
          <View style={styles.shapeSquare3} />
          <View style={styles.shapeCircle5} />
          
          {liveClass ? (
            <>
              <View style={styles.liveHeader}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeText}>LIVE NOW</Text>
                </View>
              </View>

              <View style={styles.liveContent}>
                <View style={styles.liveTextContainer}>
                  <Text 
                    style={styles.liveTitle} 
                    numberOfLines={2} 
                    ellipsizeMode="tail"
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {liveClass.courseName}
                  </Text>
                  <Text style={styles.liveSubtitle} numberOfLines={1} ellipsizeMode="tail">
                    {liveClass.meta.batch} • {liveClass.location.room}
                  </Text>
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

              <View style={styles.statsRow}>
                <View style={styles.statBadgeGreen}>
                  <Text style={styles.statBadgeTextDark}>● Attendance {liveClass.attendance?.percentage || 0}%</Text>
                </View>
                <View style={styles.statBadgePeach}>
                  <Text style={styles.statBadgeTextDark}>{liveClass.attendance?.safeToMiss || 0} Safe to Bunk</Text>
                </View>
                <View style={styles.statBadgeYellow}>
                  <Text style={styles.statBadgeTextDark}>{liveClass.attendance?.missed || 0} Missed</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.viewDetailsButton}
                onPress={() => navigation.navigate('StudentSyllabusLearningPath', { 
                  subject: { 
                    title: liveClass.courseName, 
                    subjectCode: liveClass.subjectCode,
                    subjectId: liveClass.subjectId
                  },
                  initialTab: 'attendance'
                })}
              >
                <Text style={styles.viewDetailsText}>View Details</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.textWhite} style={styles.viewDetailsArrow} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.noLiveClassContainer}>
              <Ionicons name="information-circle-outline" size={48} color={colors.primaryPeach} />
              <Text style={styles.noLiveClassText}>No Live Class</Text>
              <Text style={styles.noLiveClassSubtext}>
                {upcomingClasses.length > 0 ? 'Your next class will begin soon' : 'All classes for today are completed'}
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View style={{ opacity: listItemsFade, transform: [{ translateY: listItemsSlide }] }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Subjects</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.subjectsScrollContent}
          >
            {subjects.length > 0 ? (
              subjects.map((item, idx) => (
                <TouchableOpacity 
                  key={item.enrollmentId || idx} 
                  style={[styles.subjectMiniCard, { borderLeftColor: idx % 2 === 0 ? colors.primaryGreen : colors.primaryPeach }]}
                  onPress={() => navigation.navigate('StudentSyllabusLearningPath', { 
                    subject: { 
                      title: item.subject.subjectName, 
                      subjectCode: item.subject.subjectCode,
                      ...item.subject
                    } 
                  })}
                >
                  <Text style={styles.subjectMiniCode}>{item.subject.subjectCode}</Text>
                  <Text style={styles.subjectMiniName} numberOfLines={2}>{item.subject.subjectName}</Text>
                  <View style={styles.subjectMiniGrade}>
                    <Text style={styles.subjectMiniGradeText}>{item.attendancePercentage}%</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              // Fallback skeleton or mock cards if empty
              [1, 2, 3].map((_, idx) => (
                <View key={idx} style={[styles.subjectMiniCard, { opacity: 0.5 }]}>
                  <Text style={styles.subjectMiniCode}>---</Text>
                  <Text style={styles.subjectMiniName}>No Data</Text>
                </View>
              ))
            )}
          </ScrollView>

          <Text style={styles.sectionTitle}>Upcoming Classes</Text>

          {upcomingClasses.length > 0 ? (
            upcomingClasses.map((classItem, index) => (
              <View key={classItem.id} style={styles.upcomingCard}>
                <View style={styles.cardInfo}>
                  <View style={styles.tagRow}>
                    <View style={styles.tagNext}>
                      <Text style={styles.tagTextNext}>{index === 0 ? 'NEXT' : 'UPCOMING'}</Text>
                    </View>
                    <Text style={styles.courseTag}>{classItem.tag}</Text>
                  </View>
                  <Text style={styles.courseTitle} numberOfLines={2} ellipsizeMode="tail">{classItem.courseName}</Text>
                  <Text style={styles.courseSubtitle} numberOfLines={1} ellipsizeMode="tail">{classItem.meta.section} • {classItem.location.room}</Text>
                </View>
                <View style={styles.timeBox}>
                  <Ionicons name="time-outline" size={16} color={colors.primaryPeach} />
                  <Text style={styles.timeText}>{classItem.timings.startLabel}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noUpcomingContainer}>
              <Text style={styles.noUpcomingText}>No upcoming classes</Text>
            </View>
          )}
        </Animated.View>
        </>
        ) : (
          <Animated.View style={{ opacity: listItemsFade, transform: [{ translateY: listItemsSlide }] }}>
            <Text style={styles.sectionTitle}>Completed Classes</Text>
            {completedClasses.length > 0 ? (
              completedClasses.map((classItem) => (
                <View key={classItem.id} style={[styles.upcomingCard, styles.completedCard]}>
                  <View style={styles.cardInfo}>
                    <View style={styles.tagRow}>
                      <View style={styles.tagCompleted}>
                        <Text style={styles.tagTextCompleted}>COMPLETED</Text>
                      </View>
                      <Text style={styles.courseTag}>{classItem.tag}</Text>
                    </View>
                    <Text style={styles.courseTitle} numberOfLines={2} ellipsizeMode="tail">{classItem.courseName}</Text>
                    <Text style={styles.courseSubtitle} numberOfLines={1} ellipsizeMode="tail">{classItem.meta.section} • {classItem.location.room}</Text>
                  </View>
                  <View style={[styles.timeBox, styles.timeBoxCompleted]}>
                    <Ionicons name="checkmark-done-circle" size={16} color={colors.primaryGreen} />
                    <Text style={[styles.timeText, styles.timeTextCompleted]}>{classItem.timings.startLabel}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noUpcomingContainer}>
                 <Ionicons name="checkmark-done" size={48} color={colors.primaryGreen} />
                 <Text style={[styles.noUpcomingText, { marginTop: 12, color: colors.textWhite, fontSize: 16, fontWeight: '700' }]}>No Completed Classes</Text>
                 <Text style={[styles.noUpcomingText, { marginTop: 4 }]}>You haven't completed any classes yet</Text>
              </View>
            )}
          </Animated.View>
        )}

      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.logoutModalContainer}>
          <View style={styles.logoutModalContent}>
            <View style={styles.logoutModalIcon}>
              <Ionicons name="log-out-outline" size={48} color="#FF7E6B" />
            </View>
            
            <Text style={styles.logoutModalTitle}>Logout?</Text>
            <Text style={styles.logoutModalMessage}>
              Are you sure you want to logout? You'll need to login again to access your account.
            </Text>
            
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity
                style={styles.logoutModalCancelBtn}
                onPress={() => setLogoutModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={styles.logoutModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.logoutModalConfirmBtn}
                onPress={() => {
                  setLogoutModalVisible(false);
                  handleLogout();
                }}
                disabled={isLoading}
              >
                <Text style={styles.logoutModalConfirmText}>
                  {isLoading ? 'Logging out...' : 'Logout'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    color: colors.textWhite,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subGreeting: {
    color: colors.textGrey,
    fontSize: typography.body2,
    marginTop: 4,
  },
  avatarContainer: {
    position: 'relative',
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
    marginBottom: 20,
    marginTop: 10,
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
    marginBottom: 30,
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
    backgroundColor: 'rgba(255,255,255,0.3)',
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
    color: colors.darkOverlay,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  liveContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  liveTextContainer: {
    flex: 1,
  },
  liveTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.darkOverlay,
    lineHeight: 34,
  },
  liveSubtitle: {
    fontSize: typography.body2,
    color: colors.darkOverlay,
    marginTop: 8,
    fontWeight: '600',
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
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  statBadgeGreen: {
    backgroundColor: '#8DE0A6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBadgePeach: {
    backgroundColor: colors.primaryPeach,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBadgeYellow: {
    backgroundColor: '#FFE169',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBadgeTextDark: {
    color: colors.darkOverlay,
    fontSize: 12,
    fontWeight: '700',
  },
  viewDetailsButton: {
    backgroundColor: colors.darkOverlay,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  viewDetailsText: {
    color: colors.textWhite,
    fontSize: typography.body1,
    fontWeight: '700',
    marginRight: 8,
  },
  viewDetailsArrow: {
    marginLeft: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: colors.primaryGreen,
    fontWeight: '700',
    fontSize: 14,
  },
  subjectsScrollContent: {
    paddingBottom: 20,
    gap: 12,
  },
  subjectMiniCard: {
    backgroundColor: colors.surface,
    width: 120,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  subjectMiniCode: {
    color: colors.textGrey,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  subjectMiniName: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  subjectMiniGrade: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  subjectMiniGradeText: {
    color: colors.primaryGreen,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionTitle: {
    color: colors.textWhite,
    fontSize: typography.h4,
    fontWeight: '700',
    marginBottom: 16,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagTextNext: {
    color: colors.darkOverlay,
    fontSize: 10,
    fontWeight: 'bold',
  },
  courseTag: {
    color: colors.textGrey,
    fontSize: 12,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  courseTitle: {
    color: colors.textWhite,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
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
    width: 60,
    height: 70,
  },
  timeText: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  // Decorative shapes for liveCard background
  shapeCircle1: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    top: -20,
    right: -10,
    zIndex: 0,
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
  menuButton: {
    padding: 8,
    marginRight: -8,
  },
  // Logout Modal Styles
  logoutModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  logoutModalIcon: {
    marginBottom: 20,
  },
  logoutModalTitle: {
    color: colors.textWhite,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  logoutModalMessage: {
    color: colors.textGrey,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 28,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  logoutModalCancelBtn: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutModalCancelText: {
    color: colors.textGrey,
    fontSize: 16,
    fontWeight: '700',
  },
  logoutModalConfirmBtn: {
    flex: 1,
    backgroundColor: '#FF7E6B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutModalConfirmText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  noLiveClassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noLiveClassText: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  noLiveClassSubtext: {
    color: colors.textGrey,
    fontSize: 14,
    marginTop: 4,
  },
  noUpcomingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noUpcomingText: {
    color: colors.textGrey,
    fontSize: 14,
  },
  tagCompleted: {
    backgroundColor: colors.primaryGreen,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagTextCompleted: {
    color: colors.darkOverlay,
    fontSize: 10,
    fontWeight: 'bold',
  },
  completedCard: {
    opacity: 0.9,
  },
  timeBoxCompleted: {
    borderColor: colors.primaryGreen,
  },
  timeTextCompleted: {
    color: colors.primaryGreen,
  },
});
