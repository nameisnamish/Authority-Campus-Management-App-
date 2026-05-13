import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutAnimation, Platform, UIManager, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

import { Student_schedule_API_ROUTES } from '../../lib/constants';
import { getAccessToken } from '../../utils/tokenStorage';

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
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  return <Animated.View style={[style, { opacity: animatedValue, backgroundColor: 'rgba(255,255,255,0.05)' }]} />;
};

const AttendanceSkeleton = () => (
  <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
    {/* Stats Skeleton */}
    <View style={styles.statsGlass}>
      {[1, 2, 3, 4].map((i) => (
        <React.Fragment key={i}>
          <View style={styles.statGroup}>
            <SkeletonPlaceholder style={{ width: 30, height: 8, marginBottom: 4, borderRadius: 2 }} />
            <SkeletonPlaceholder style={{ width: 40, height: 20, borderRadius: 4 }} />
          </View>
          {i < 4 && <View style={styles.vDivider} />}
        </React.Fragment>
      ))}
    </View>

    {/* Calendar Skeleton */}
    <View style={styles.calendarGlass}>
      <View style={styles.headerRow}>
        <SkeletonPlaceholder style={{ width: 120, height: 24, borderRadius: 4 }} />
        <View style={styles.navActions}>
           <SkeletonPlaceholder style={{ width: 26, height: 26, borderRadius: 6 }} />
           <SkeletonPlaceholder style={{ width: 26, height: 26, borderRadius: 6 }} />
        </View>
      </View>

      <View style={styles.legendRow}>
         <SkeletonPlaceholder style={{ width: 60, height: 14, borderRadius: 4, marginRight: 20 }} />
         <SkeletonPlaceholder style={{ width: 60, height: 14, borderRadius: 4 }} />
      </View>

      <View style={styles.gridOuter}>
        <View style={styles.weekHeader}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <View key={i} style={styles.headerCell}>
              <SkeletonPlaceholder style={{ width: 10, height: 10, borderRadius: 5 }} />
            </View>
          ))}
        </View>

        <View style={styles.datesContainer}>
          {[1, 2, 3, 4, 5].map((wi) => (
            <View key={wi} style={styles.weekRow}>
              {[1, 2, 3, 4, 5, 6, 7].map((di) => (
                <SkeletonPlaceholder key={di} style={[styles.dayCell, { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'transparent' }]} />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  </ScrollView>
);

// ─── Refined Week Generator ──────────────────────────────────────────────────
const getWeeks = (month, year, data) => {
  const weeks = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); 
  const shift = firstDay === 0 ? 6 : firstDay - 1;

  let currentWeek = Array(shift).fill({ type: 'empty' });

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const sessions = data?.[dateStr] || [];
    let status = 'none';
    if (sessions.length > 0) {
      // If any session is absent, mark the day as absent
      status = sessions.some(s => s.status === 'absent') ? 'absent' : 'present';
    }

    currentWeek.push({
      day: d,
      dateStr,
      status: status,
      type: 'day'
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ type: 'empty' });
    }
    weeks.push(currentWeek);
  }

  return weeks;
};

export default function AttendanceTab({ subject }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [stats, setStats] = useState({ percentage: 0, present: 0, absent: 0 });

  useEffect(() => {
    fetchAttendance();
  }, [subject?.subjectId, currentMonth, currentYear]);

  const fetchAttendance = async () => {
    if (!subject?.subjectId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const token = getAccessToken();
      const url = `${Student_schedule_API_ROUTES.STUDENT_ATTENDANCE_REPORT}?subject_id=${subject.subjectId}&month=${currentMonth + 1}&year=${currentYear}`;
      
      console.log('📡 Fetching Attendance for Subject:', subject.subjectId, `(${months[currentMonth]} ${currentYear})`);
      console.log('🔗 URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        }
      });

      const result = await response.json();
      console.log('📦 RAW API RESPONSE (Student Attendance):', JSON.stringify(result, null, 2));

      if (result.success) {
        setAttendanceRecords(result.data.calendar);
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('❌ Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calendarData = attendanceRecords;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weeks = getWeeks(currentMonth, currentYear, calendarData);
  const selectedDaySessions = selectedDate ? (calendarData[selectedDate] || []) : [];

  const handleSelect = (date) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDate(date === selectedDate ? null : date);
  };

  const changeMonth = (dir) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (dir === 'next') {
      if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
      else setCurrentMonth(m => m + 1);
    } else {
      if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
      else setCurrentMonth(m => m - 1);
    }
  };

  if (loading) {
    return <AttendanceSkeleton />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* 1. Header Stats */}
      <View style={styles.statsGlass}>
         <View style={styles.statGroup}>
            <Text style={styles.statLabel}>RATE</Text>
            <Text style={styles.statValue}>{Math.round(stats.percentage)}%</Text>
         </View>
         <View style={styles.vDivider} />
         <View style={styles.statGroup}>
            <Text style={styles.statLabel}>PRESENT</Text>
            <Text style={[styles.statValue, { color: colors.primaryGreen }]}>{String(stats.present).padStart(2, '0')}</Text>
         </View>
         <View style={styles.vDivider} />
         <View style={styles.statGroup}>
            <Text style={styles.statLabel}>ABSENT</Text>
            <Text style={[styles.statValue, { color: colors.primaryPeach }]}>{String(stats.absent).padStart(2, '0')}</Text>
         </View>
         <View style={styles.vDivider} />
         <View style={styles.statGroup}>
            <Text style={styles.statLabel}>SAFE BUNKS</Text>
            <Text style={[
              styles.statValue, 
              { color: (stats.safeBunks || 0) >= 0 ? colors.primaryGreen : colors.primaryPeach }
            ]}>
              {(stats.safeBunks || 0) >= 0 ? `+${stats.safeBunks}` : stats.safeBunks}
            </Text>
         </View>
      </View>

      {/* 2. Discrete Grid Calendar */}
      <View style={styles.calendarGlass}>
        <View style={styles.headerRow}>
          <Text style={styles.monthTitle}>{months[currentMonth]} {currentYear}</Text>
          <View style={styles.navActions}>
             <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={14} color="#fff" />
             </TouchableOpacity>
             <TouchableOpacity onPress={() => changeMonth('next')} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={14} color="#fff" />
             </TouchableOpacity>
          </View>
        </View>

        <View style={styles.legendRow}>
           <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.primaryGreen }]} />
              <Text style={styles.legendText}>Present</Text>
           </View>
           <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.primaryPeach }]} />
              <Text style={styles.legendText}>Absent</Text>
           </View>
        </View>

        <View style={styles.gridOuter}>
          <View style={styles.weekHeader}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <View key={i} style={styles.headerCell}>
                <Text style={styles.dayLabel}>{d}</Text>
              </View>
            ))}
          </View>

          <View style={styles.datesContainer}>
            {weeks.map((week, wi) => (
              <View key={wi} style={styles.weekRow}>
                {week.map((day, di) => {
                  const isSelected = selectedDate === day.dateStr;
                  const hasData = day.status !== 'none';
                  const sColor = day.status === 'present' ? colors.primaryGreen : colors.primaryPeach;

                  if (day.type === 'empty') {
                    return <View key={di} style={styles.cellEmpty} />;
                  }

                  return (
                    <TouchableOpacity 
                      key={di}
                      activeOpacity={0.7}
                      onPress={() => handleSelect(day.dateStr)}
                      style={[
                        styles.dayCell,
                        hasData && { backgroundColor: sColor },
                        !hasData && { backgroundColor: 'rgba(255,255,255,0.02)' },
                        isSelected && styles.selectedDay
                      ]}
                    >
                      <Text style={[
                        styles.dayText,
                        hasData ? { color: '#000' } : { color: 'rgba(255,255,255,0.6)' },
                        isSelected && { color: '#fff' }
                      ]}>
                        {day.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 3. Detail View - List of Sessions */}
      {selectedDate && selectedDaySessions.length > 0 && (
        <View style={styles.detailGlass}>
           <Text style={styles.detailDate}>
             {selectedDate.split('-')[2]} {months[parseInt(selectedDate.split('-')[1])-1]} Details
           </Text>
           
           {selectedDaySessions.map((session, idx) => (
             <View key={idx} style={[styles.sessionItem, idx !== 0 && styles.sessionDivider]}>
               <View style={styles.detailHeader}>
                  <View style={styles.sessionHeaderMain}>
                     <View style={[styles.sessionStatusDot, { backgroundColor: session.status === 'present' ? colors.primaryGreen : colors.primaryPeach }]} />
                     <Text style={styles.detailType}>{session.sessionDetail?.duration || '1 hr'} Session</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: session.status === 'present' ? colors.primaryGreen : colors.primaryPeach }]}>
                     <Text style={styles.badgeText}>
                        {session.status === 'present' ? 'PRESENT' : 'ABSENT'}
                     </Text>
                  </View>
               </View>
               <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                     <Ionicons name="time-outline" size={12} color={colors.textGrey} />
                     <Text style={styles.metaText}>{session.sessionDetail?.timeLabel || 'N/A'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                     <Ionicons name="location-outline" size={12} color={colors.textGrey} />
                     <Text style={styles.metaText}>Room {session.sessionDetail?.room || 'N/A'}</Text>
                  </View>
               </View>
             </View>
           ))}
        </View>
      )}

      {selectedDate && selectedDaySessions.length === 0 && (
        <View style={styles.detailGlass}>
           <Text style={styles.detailDate}>No records for this date</Text>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, paddingBottom: 40 },
  statsGlass: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statGroup: { alignItems: 'center' },
  statLabel: { color: colors.textGrey, fontSize: 7, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  vDivider: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.1)' },

  calendarGlass: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  monthTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  navActions: { flexDirection: 'row', gap: 6 },
  navBtn: { width: 26, height: 26, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  
  legendRow: { flexDirection: 'row', gap: 20, marginBottom: 16, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { color: colors.textGrey, fontSize: 13, fontWeight: '700' },

  gridOuter: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  weekHeader: { 
    flexDirection: 'row', 
    borderBottomWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 10,
    marginBottom: 12,
  },
  headerCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '800' },
  
  datesContainer: { gap: 8 },
  weekRow: { flexDirection: 'row', gap: 6 },
  dayCell: { flex: 1, height: 38, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.05)' },
  cellEmpty: { flex: 1, height: 38 },
  dayText: { fontSize: 14, fontWeight: '700' },
  selectedDay: { borderWidth: 1.5, borderColor: '#fff' },

  detailGlass: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  detailDate: { color: '#fff', fontSize: 16, fontWeight: '700' },
  detailType: { color: colors.textGrey, fontSize: 11 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#000' },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: colors.textGrey, fontSize: 11 },
  sessionItem: { paddingVertical: 8 },
  sessionDivider: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', marginTop: 8, paddingTop: 12 },
  sessionHeaderMain: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessionStatusDot: { width: 6, height: 6, borderRadius: 3 },
});
