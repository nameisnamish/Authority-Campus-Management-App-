import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import Notification from '../components/Notification';
import { useCache } from '../hooks/useCache';
import { Teacher_Attendance_Report_API_ROUTES, AttendanceStatus_Update_API_ROUTES, BASE_URL } from '../lib/constants';
import { generateCalendarWeeks, getMonthName, formatDate, getDayName } from '../utils/calendarHelper';
import { getAccessToken } from '../utils/tokenStorage';

export default function TeacherSubjectStudentAttendancePage({ route, navigation }) {
  const { student, subject } = route.params || {};
  const [isUpdateExpanded, setIsUpdateExpanded] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNotificationVisible, setNotificationVisible] = useState(false);
  
  const { getCachedData, setCachedData } = useCache();

  const studentName = student?.name || 'Student';
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  useEffect(() => {
    fetchAttendanceData();
  }, [student, subject, currentMonth, currentYear]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDate(null);
  };

  const fetchAttendanceData = async () => {
    if (!student?.id || !subject?.subjectId) {
      setError('Missing student or subject information');
      return;
    }

    // Create cache key
    const cacheKey = `studentReport_${student.id}_${subject.subjectId}_${currentMonth}_${currentYear}`;
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      console.log('📦 Using cached attendance data');
      setAttendanceData(cachedData);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const apiUrl = `${Teacher_Attendance_Report_API_ROUTES.REPORT}?student_id=${student.id}&subject_id=${subject.subjectId}&month=${currentMonth + 1}&year=${currentYear}`;
      const userToken = getAccessToken();
      
      console.log('📡 Fetching attendance data from:', apiUrl);
      console.log('🎯 Parameters:', { student_id: student.id, subject_id: subject.subjectId, month: currentMonth + 1, year: currentYear });
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${userToken}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
      });
      console.log('📡 Response Status:', response.status);
      const responseText = await response.text();
      console.log('📦 Raw Response Text:', responseText);

      let data = { success: false };
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('❌ JSON Parse Error:', e);
          throw new Error('Server returned invalid JSON response');
        }
      } else if (response.ok) {
        data = { success: true };
      }

      console.log('📦 Attendance Report API Response:', JSON.stringify(data, null, 2));

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch attendance data');
      }

      // Transform API response
      const transformedData = {
        studentInfo: data.data.studentInfo,
        stats: data.data.stats,
        calendar: data.data.calendar,
        selectedDate: null,
        selectedDateData: null,
      };

      setAttendanceData(transformedData);
      
      // Cache the data
      setCachedData(cacheKey, transformedData);
      console.log('✅ Attendance data cached');

    } catch (err) {
      console.error('❌ Error fetching attendance data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedDate || !student?.id || !subject?.subjectId) return;

    try {
      setUpdating(true);
      setUpdateError(null);
      const userToken = getAccessToken();
      const apiUrl = AttendanceStatus_Update_API_ROUTES.UPDATE;

      console.log('📡 Updating attendance:', {
        student_id: student.id,
        subject_id: subject.subjectId,
        date: selectedDate,
        status: newStatus
      });

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          student_id: student.id,
          subject_id: subject.subjectId,
          date: selectedDate,
          status: newStatus.toUpperCase()
        })
      });

      console.log('📡 Response Status:', response.status);
      const responseText = await response.text();
      console.log('📦 Raw Response Text:', responseText);

      let data = { success: false };
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('❌ JSON Parse Error:', e);
          throw new Error('Server returned invalid JSON response');
        }
      } else if (response.ok) {
        // Empty body but 2xx status
        data = { success: true };
      }

      console.log('📦 Update Status API Response:', JSON.stringify(data, null, 2));

      if (!data.success) {
        throw new Error(data.message || 'Failed to update attendance');
      }

      console.log('✅ Attendance updated successfully');
      
      // Clear cache for this specific report to force fresh fetch
      const cacheKey = `studentReport_${student.id}_${subject.subjectId}_${currentMonth}_${currentYear}`;
      // Note: useCache hook might need a removeCachedData method, but we can just refetch
      
      setIsUpdateExpanded(false);
      fetchAttendanceData(); // Refresh data

    } catch (err) {
      console.log('⚠️ Update error (handled):', err.message);
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Helper function to generate calendar weeks from API data
  const generateCalendarWeeksFromAPI = () => {
    if (!attendanceData?.calendar) return [];
    return generateCalendarWeeks(attendanceData.calendar, currentMonth, currentYear);
  };

  const renderCalendarCell = (dayObj) => {
    const { day, status, dateStr, dayData } = dayObj;

    if (!day) {
      return <View key={`empty-${Math.random()}`} style={styles.calDate} />;
    }

    let cellStyle = styles.calDate;
    let textStyle = styles.calDateText;
    const isSelected = selectedDate === dateStr;

    if (status === 'present') {
      cellStyle = [styles.calDate, { 
        borderColor: colors.primaryGreen, 
        backgroundColor: isSelected ? 'rgba(84, 219, 115, 0.3)' : 'rgba(84, 219, 115, 0.15)' 
      }];
      textStyle = [styles.calDateText, { color: colors.primaryGreen }];
    } else if (status === 'absent') {
      cellStyle = [styles.calDate, { 
        borderColor: '#AF391E', 
        backgroundColor: isSelected ? 'rgba(175, 57, 30, 0.4)' : 'rgba(175, 57, 30, 0.25)' 
      }];
      textStyle = [styles.calDateText, { color: '#FF7050' }];
    } else if (status === 'leave') {
      cellStyle = [styles.calDate, { 
        borderColor: colors.primaryPeach, 
        backgroundColor: isSelected ? 'rgba(255, 112, 80, 0.3)' : 'rgba(255, 112, 80, 0.15)' 
      }];
      textStyle = [styles.calDateText, { color: colors.primaryPeach }];
    } else if (status === 'none') {
      textStyle = [styles.calDateText, { color: isSelected ? colors.primaryGreen : '#999999' }];
      cellStyle = [styles.calDate, { 
        borderColor: isSelected ? colors.primaryGreen : 'transparent',
        backgroundColor: isSelected ? 'rgba(84, 219, 115, 0.05)' : 'transparent'
      }];
    } else {
      textStyle = [styles.calDateText, { color: '#999999' }];
      cellStyle = [styles.calDate, { borderColor: 'transparent' }];
    }

    return (
      <TouchableOpacity
        key={dateStr || `empty-${day}`}
        style={cellStyle}
        onPress={() => {
          if (status !== 'empty') {
            setSelectedDate(dateStr);
            setSelectedStatus(status === 'none' ? null : status);
            setUpdateError(null); // Clear error when selecting new date
          }
        }}
      >
        <Text style={textStyle}>{day}</Text>
      </TouchableOpacity>
    );
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    // Fallback to the main Subject Manager hub
    navigation.navigate('TeacherSubjectManager', { subject });
  };

  const getSelectedDateInfo = () => {
    if (!selectedDate) {
      return null;
    }
    return attendanceData?.calendar?.[selectedDate] || { status: 'none' };
  };

  const calendarWeeks = attendanceData ? generateCalendarWeeksFromAPI() : [];
  const monthName = getMonthName(currentMonth);
  const overallPercentage = attendanceData?.stats?.overallPercentage || 0;
  const classesAttended = attendanceData?.stats?.classesAttended || 0;
  const classesMissed = attendanceData?.stats?.classesMissed || 0;
  const selectedDateInfo = getSelectedDateInfo();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={26} color={colors.primaryGreen} />
        </TouchableOpacity>
        <Text style={styles.headerTitleBase}>
          {studentName} – <Text style={styles.headerTitleGreen}>Attendance</Text>
        </Text>
        <TouchableOpacity onPress={() => setNotificationVisible(true)} style={styles.bellButton}>
          <Ionicons name="notifications-outline" size={26} color={colors.primaryGreen} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryGreen} />
            <Text style={styles.loadingText}>Loading attendance data...</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchAttendanceData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && attendanceData && (
          <>
        {/* Top Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCardLeft}>
            <Text style={styles.statCardTitle}>OVERALL</Text>
            <View style={styles.statCardRow}>
              <Text style={styles.statCardHero}>{Math.round(overallPercentage)}%</Text>
              <Text style={styles.statCardSub}>Above{'\n'}Avg</Text>
            </View>
          </View>
          
          <View style={styles.statCardRight}>
            <Text style={styles.statCardTitleRight}>TOTAL ABSENTS</Text>
            <Text style={styles.statCardHeroRight}>{classesMissed}</Text>
          </View>
        </View>

        {/* Calendar Header */}
        <View style={styles.monthHeaderRow}>
          <View>
            <Text style={styles.monthTitle}>{monthName} {currentYear}</Text>
            <Text style={styles.monthSubtitle}>Monthly Attendance Overview</Text>
          </View>
          <View style={styles.monthNavControls}>
            <TouchableOpacity style={styles.navButton} onPress={handlePrevMonth}>
              <Ionicons name="chevron-back" size={16} color={colors.textWhite} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={handleNextMonth}>
              <Ionicons name="chevron-forward" size={16} color={colors.textWhite} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Container */}
        <View style={styles.calendarContainer}>
          <View style={styles.calDaysRow}>
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
              <Text key={day} style={styles.calDayLabel}>{day}</Text>
            ))}
          </View>
          
          <View style={styles.calGrid}>
            {calendarWeeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.calRow}>
                {week.map((dayObj, dayIndex) => renderCalendarCell(dayObj))}
              </View>
            ))}
          </View>
        </View>

        {/* Detail Panel */}
        {selectedDateInfo ? (
          <View style={styles.detailCard}>
            <View style={styles.detailHeaderRow}>
              <View style={styles.detailTitleWrapper}>
                <View style={[styles.verticalRule, { backgroundColor: selectedStatus === 'absent' ? '#FF7050' : selectedStatus === 'leave' ? colors.primaryPeach : selectedStatus === 'present' ? colors.primaryGreen : '#444' }]} />
                <View>
                  <Text style={styles.detailDateText}>{selectedDate}</Text>
                  <Text style={styles.detailStatusText}>STATUS: {selectedStatus ? selectedStatus.toUpperCase() : 'NOT MARKED'}</Text>
                </View>
              </View>
              <View style={styles.calendarIconContainer}>
                <Ionicons name="calendar" size={32} color="#5B453A" />
                <View style={styles.iconOverlay}>
                  <Ionicons name={selectedStatus === 'absent' ? "close" : "checkmark"} size={14} color={selectedStatus === 'absent' ? '#AF391E' : colors.primaryGreen} />
                </View>
              </View>
            </View>

            <Text style={styles.subjectText}>{subject?.title || 'Subject'}</Text>
            {selectedDateInfo?.sessionDetail && (
              <Text style={styles.sessionText}>
                Session: {selectedDateInfo.sessionDetail.startTime} • {selectedDateInfo.sessionDetail.room}
              </Text>
            )}

            {/* Update Status Dropdown */}
            <TouchableOpacity 
              style={[styles.updateButton, isUpdateExpanded && styles.updateButtonExpanded]} 
              onPress={() => {
                setIsUpdateExpanded(!isUpdateExpanded);
                if (!isUpdateExpanded) setUpdateError(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.updateButtonText}>Update Status</Text>
              <Ionicons name={isUpdateExpanded ? "chevron-up" : "chevron-down"} size={20} color="#000" />
            </TouchableOpacity>

            {updateError && (
              <View style={styles.updateErrorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ff6b6b" />
                <Text style={styles.updateErrorText}>{updateError}</Text>
                <TouchableOpacity onPress={() => setUpdateError(null)}>
                  <Ionicons name="close" size={16} color="#ff6b6b" />
                </TouchableOpacity>
              </View>
            )}

            {isUpdateExpanded && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity 
                  style={styles.dropdownOption} 
                  onPress={() => handleUpdateStatus('PRESENT')}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color={colors.primaryGreen} style={styles.optionIcon} />
                  ) : (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primaryGreen} style={styles.optionIcon} />
                  )}
                  <Text style={styles.optionText}>Change to Present</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity 
                  style={styles.dropdownOption} 
                  onPress={() => handleUpdateStatus('ABSENT')}
                  disabled={updating}
                >
                  <Ionicons name="close-circle" size={20} color="#AF391E" style={styles.optionIcon} />
                  <Text style={styles.optionText}>Change to Absent</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity 
                  style={styles.dropdownOption} 
                  onPress={() => handleUpdateStatus('LEAVE')}
                  disabled={updating}
                >
                  <Ionicons name="briefcase" size={20} color={colors.primaryPeach} style={styles.optionIcon} />
                  <Text style={styles.optionText}>Change to Leave</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noSelectionContainer}>
            <Ionicons name="calendar-outline" size={48} color={colors.textGrey} />
            <Text style={styles.noSelectionText}>Select a date to view details</Text>
          </View>
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
    backgroundColor: '#111111',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#0a0a0a'
  },
  bellButton: {
    padding: 4,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitleBase: {
    flex: 1,
    color: colors.textWhite,
    fontSize: 22,
    fontWeight: '700',
  },
  headerTitleGreen: {
    color: colors.primaryGreen,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  statCardLeft: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginRight: 12,
  },
  statCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  statCardTitle: {
    color: colors.textGrey,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  statCardHero: {
    color: colors.primaryGreen,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
  },
  statCardSub: {
    color: colors.primaryGreen,
    fontSize: 11,
    fontWeight: '600',
    paddingBottom: 4,
  },
  statCardRight: {
    flex: 1,
    backgroundColor: '#AF391E',
    borderRadius: 16,
    padding: 20,
    marginLeft: 12,
  },
  statCardTitleRight: {
    color: '#FFB8A6',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  statCardHeroRight: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    color: colors.textWhite,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  monthSubtitle: {
    color: colors.textGrey,
    fontSize: 13,
  },
  monthNavControls: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 24,
  },
  calDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  calDayLabel: {
    color: '#AAAAAA',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    width: 38,
    textAlign: 'center',
  },
  calGrid: {
    gap: 12,
  },
  calRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  calDate: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  calDateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  detailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailTitleWrapper: {
    flexDirection: 'row',
  },
  verticalRule: {
    width: 4,
    backgroundColor: '#FF7050',
    borderRadius: 2,
    marginRight: 12,
  },
  detailDateText: {
    color: colors.textWhite,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailStatusText: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  calendarIconContainer: {
    width: 44,
    height: 44,
    backgroundColor: '#2A1F1B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#2A1F1B',
    borderRadius: 10,
    padding: 2,
  },
  subjectText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  sessionText: {
    color: colors.textGrey,
    fontSize: 13,
    marginBottom: 24,
  },
  updateButton: {
    backgroundColor: colors.primaryGreen,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: colors.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  updateButtonExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  updateButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  dropdownMenu: {
    backgroundColor: '#262626',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#333',
    paddingTop: 8,
    paddingBottom: 8,
    marginTop: -4,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 16,
  },
  updateErrorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  updateErrorText: {
    color: '#ff6b6b',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: colors.textGrey,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noSelectionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  noSelectionText: {
    color: colors.textGrey,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
});