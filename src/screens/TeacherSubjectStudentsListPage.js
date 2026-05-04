import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import Notification from '../components/Notification';
import { useCache } from '../hooks/useCache';
import { Class_Enrollment_API_ROUTES, BASE_URL } from '../lib/constants';
import { getAccessToken } from '../utils/tokenStorage';

export default function TeacherSubjectStudentsListPage({ route, navigation }) {
  const { subject } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNotificationVisible, setNotificationVisible] = useState(false);
  
  const { getCachedData, setCachedData } = useCache();

  // Fetch students enrolled in the subject
  useEffect(() => {
    fetchStudentList();
  }, [subject]);

  const fetchStudentList = async () => {
    if (!subject?.subjectId) {
      setError('Subject ID not found');
      return;
    }

    // Check cache first
    const cacheKey = `studentList_${subject.subjectId}`;
    const cachedStudents = getCachedData(cacheKey);
    
    if (cachedStudents) {
      console.log('📦 Using cached student list');
      setStudents(cachedStudents.students);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Extract subjectId and sectionId from subject object
      const subject_id = subject.subjectId;
      const section_id = subject.sectionId || '1'; // Fallback if not provided

      const apiUrl = `${Class_Enrollment_API_ROUTES.ENROLL}?subject_id=${subject_id}&section_id=${section_id}`;
      
      console.log('📡 Fetching student list from:', apiUrl);
      console.log('🎯 Parameters:', { subject_id, section_id });
      
      const token = getAccessToken();
      console.log('🔑 JWT Token:', token ? '✅ Present' : '❌ Missing');

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'ReactNative',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('📦 Student List API Response:', JSON.stringify(data, null, 2));

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch students');
      }

      // Transform API response to match UI format
      const transformedStudents = data.data.students.map(student => ({
        id: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        programName: student.programName,
        batchName: student.batchName,
        attendancePercentage: student.attendancePercentage,
        profileImage: student.profileImage,
        // Extra fields for UI display
        roll: `#${student.rollNumber}`,
        course: `${student.programName} • ${student.batchName}`,
        attendance: Math.round(student.attendancePercentage),
        image: student.profileImage || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      }));

      setStudents(transformedStudents);

      // Cache the data
      const cachePayload = {
        subjectId: data.data.subjectId,
        sectionId: data.data.sectionId,
        periodName: data.data.periodName,
        totalStudents: data.data.totalStudents,
        students: transformedStudents,
      };
      
      setCachedData(cacheKey, cachePayload);
      console.log('✅ Student list cached');

    } catch (err) {
      console.error('❌ Error fetching students:', err);
      setError(err.message);
      // Fallback to empty list on error
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('TeacherDashboardTabs', { screen: 'Schedule' });
  };

  const title = subject ? `${subject.title} – ${subject.tag}` : 'Operating Systems – BCA Sem 4';

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAttendanceStyle = (percentage) => {
    // Dark green for high attendance (like the image)
    if (percentage >= 80) return { color: colors.primaryGreen, borderColor: colors.primaryGreen };
    // Orange/Peach for medium
    if (percentage >= 65 && percentage < 80) return { color: colors.primaryPeach, borderColor: colors.primaryPeach };
    // Reddish for low
    return { color: '#ff6b6b', borderColor: '#ff6b6b' }; 
  };

  const renderStudentCard = ({ item }) => {
    const attendanceStyle = getAttendanceStyle(item.attendance);
    return (
      <TouchableOpacity 
        style={styles.cardContainer}
        onPress={() => navigation.push('TeacherSubjectStudentAttendancePage', { student: item, subject })}
        activeOpacity={0.8}
      >
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.image }} style={styles.avatarImage} />
          <View style={styles.rollBadge}>
            <Text style={styles.rollText}>{item.roll}</Text>
          </View>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.nameText}>{item.name}</Text>
          <Text style={styles.courseText}>{item.course}</Text>
        </View>

        <View style={[styles.attendanceBadge, { borderColor: attendanceStyle.borderColor }]}>
          <Text style={[styles.attendanceText, { color: attendanceStyle.color }]}>{item.attendance}%</Text>
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={26} color={colors.primaryGreen} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={2}>{title}</Text>
        <TouchableOpacity style={styles.bellButton} onPress={() => setNotificationVisible(true)}>
          <Ionicons name="notifications-outline" size={26} color={colors.primaryGreen} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textGrey} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search student name or roll number.."
          placeholderTextColor={colors.textGrey}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>ACTIVE ENROLLMENT: {students.length} STUDENTS</Text>
        <TouchableOpacity style={styles.sortButton}>
          <Ionicons name="filter" size={16} color={colors.primaryGreen} />
          <Text style={styles.sortText}>SORT BY</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStudentList}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && students.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={48} color={colors.textGrey} />
          <Text style={styles.emptyText}>No students enrolled</Text>
        </View>
      )}

      {!loading && !error && students.length > 0 && (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id}
          renderItem={renderStudentCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Notification visible={isNotificationVisible} onClose={() => setNotificationVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: { 
    marginRight: 16,
    padding: 4, 
  },
  headerTitle: {
    flex: 1,
    color: colors.primaryGreen,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  bellButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 30,
    marginHorizontal: 20,
    paddingHorizontal: 20,
    height: 56,
    marginBottom: 28,
  },
  searchIcon: { 
    marginRight: 12 
  },
  searchInput: {
    flex: 1,
    color: colors.textWhite,
    fontSize: 15,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  metaText: {
    color: colors.textGrey,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortText: {
    color: colors.primaryGreen,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 16,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 40,
    padding: 16,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  rollBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  rollText: {
    color: colors.textGrey,
    fontSize: 10,
    fontWeight: '700',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameText: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  courseText: {
    color: colors.textGrey,
    fontSize: 13,
  },
  attendanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#111',
    marginLeft: 10,
  },
  attendanceText: {
    fontSize: 14,
    fontWeight: '800',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: colors.textGrey,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
});