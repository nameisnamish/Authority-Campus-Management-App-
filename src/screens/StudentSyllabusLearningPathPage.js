import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import Notification from '../components/Notification';
import { AuthContext } from '../context/AuthContext';

// Import New Tab Components
import SyllabusTab from '../components/Mysubject_detail_view/SyllabusTab';
import AttendanceTab from '../components/Mysubject_detail_view/AttendanceTab';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function StudentSyllabusLearningPathPage({ route, navigation }) {
  const { subject, initialTab } = route.params || {};
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(initialTab || 'syllabus');
  const [isNotificationVisible, setNotificationVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tabOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    
    Animated.timing(tabOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setActiveTab(tab);
      Animated.timing(tabOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleBack = () => navigation.goBack();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
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
      <Animated.View style={{ flex: 1, opacity: tabOpacity }}>
        {activeTab === 'syllabus' ? (
          <SyllabusTab subject={subject} />
        ) : (
          <AttendanceTab subject={subject} user={user} />
        )}
      </Animated.View>
      
      </Animated.View>

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
});
