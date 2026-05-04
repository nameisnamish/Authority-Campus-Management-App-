import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, LinearGradient, Stop, Defs } from 'react-native-svg';

import { colors, typography } from '../theme';
import Notification from '../components/Notification';

const { width } = Dimensions.get('window');

const StudentAnalyticsDashboard = ({ navigation }) => {
  const [activeSemester, setActiveSemester] = useState('Semester 6');
  const [isNotificationVisible, setNotificationVisible] = useState(false);
  
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(20);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const gpaTrendData = [
    { sem: 'SEM 1', gpa: 8.5, active: false },
    { sem: 'SEM 2', gpa: 8.7, active: false },
    { sem: 'SEM 3', gpa: 8.2, active: false },
    { sem: 'SEM 4', gpa: 9.0, active: false },
    { sem: 'SEM 5', gpa: 8.8, active: false },
    { sem: 'SEM 6', gpa: 9.4, active: true },
  ];

  const subjects = [
    {
      code: 'CS601',
      name: 'Data Science',
      internal: '28 / 30',
      external: '64 / 70',
      grade: 'A+',
      type: 'solid_green',
    },
    {
      code: 'CS602',
      name: 'Machine Learning',
      internal: '26 / 30',
      external: '58 / 70',
      grade: 'A',
      type: 'outline_green',
    },
    {
      code: 'HU601',
      name: 'Digital Ethics',
      internal: '29 / 30',
      external: '62 / 70',
      grade: 'B+',
      type: 'solid_peach',
    },
  ];

  const semesters = ['Semester 6', 'Semester 5', 'Semester 4', 'Semester 3', 'Semester 2', 'Semester 1'];

  const GpaCard = ({ label, value, color1, color2 }) => {
    return (
      <View style={styles.gpaCard}>
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color1} stopOpacity="1" />
                <Stop offset="0.5" stopColor={color1} stopOpacity="0.8" />
                <Stop offset="1" stopColor={color2} stopOpacity="1" />
              </LinearGradient>
              <LinearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color1} stopOpacity="0.3" />
                <Stop offset="0.5" stopColor={color1} stopOpacity="0.15" />
                <Stop offset="1" stopColor={color2} stopOpacity="0.3" />
              </LinearGradient>
            </Defs>
            
            {/* Soft inner glow bleeding from the crescent */}
            <Path
              d="M 52,0 A 52,52 0 0 0 52,104 A 32,52 0 0 1 52,0 Z"
              fill="url(#glow)"
            />
            
            {/* Sharp crescent moon border, thickest at the center, tapering to ends */}
            <Path
              d="M 52,0 A 52,52 0 0 0 52,104 A 47,52 0 0 1 52,0 Z"
              fill="url(#grad)"
            />
          </Svg>
        </View>
        <View style={styles.gpaTextContent}>
          <Text style={styles.gpaLabel}>{label}</Text>
          <Text style={styles.gpaValue}>{value}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity onPress={() => setNotificationVisible(true)}>
            <Ionicons name="notifications-outline" size={24} color={colors.textWhite} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* GPA Summary Cards */}
          <View style={styles.gpaSummaryContainer}>
            <GpaCard label="SGPA" value="8.92" color1={colors.primaryGreen} color2="#4CAF50" />
            <GpaCard label="CGPA" value="9.15" color1={colors.primaryPeach} color2="#FF6B6B" />
          </View>

          {/* GPA Trend Chart */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>GPA Trend</Text>
                <Text style={styles.chartSubtitle}>Academic growth over 6 semesters</Text>
              </View>
              <View style={styles.growthBadge}>
                <Text style={styles.growthText}>+4.2%</Text>
                <Text style={styles.growthLabel}>Growth</Text>
              </View>
            </View>

            <View style={styles.barChartContainer}>
              {gpaTrendData.map((item, index) => (
                <View key={index} style={styles.barWrapper}>
                  <View style={styles.barBackground}>
                    <View 
                      style={[
                        styles.barFill, 
                        { height: `${(item.gpa / 10) * 100}%` },
                        item.active ? styles.barFillActive : styles.barFillInactive
                      ]} 
                    />
                  </View>
                  <Text style={[styles.barLabel, item.active && styles.activeBarLabelText]}>
                    {item.sem}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Performance Insight */}
          <View style={styles.insightCard}>
            <View style={styles.insightIconContainer}>
              <Ionicons name="sparkles" size={20} color={colors.darkOverlay} />
            </View>
            <View style={styles.insightTextContainer}>
              <Text style={styles.insightTitle}>Performance Insight</Text>
              <Text style={styles.insightDesc}>
                You're in the top 5% of your class for Data Science. Keep it up!
              </Text>
            </View>
            <TouchableOpacity style={styles.insightClose}>
              <Ionicons name="close" size={20} color={colors.textGrey} />
            </TouchableOpacity>
          </View>

          {/* Semester Selector */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.semesterScroll}
            contentContainerStyle={styles.semesterScrollContent}
          >
            {semesters.map((sem) => (
              <TouchableOpacity 
                key={sem}
                style={[
                  styles.semTab,
                  activeSemester === sem ? styles.semTabActive : styles.semTabInactive
                ]}
                onPress={() => setActiveSemester(sem)}
              >
                <Text style={[
                  styles.semTabText,
                  activeSemester === sem ? styles.semTabTextActive : styles.semTabTextInactive
                ]}>
                  {sem}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Subject Cards */}
          <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 12 }]}>Subject Wise Grades</Text>
          <View style={styles.subjectsContainer}>
            {subjects.map((subject, index) => {
              let gradeStyle = {};
              let gradeTextStyle = {};
              
              if (subject.type === 'solid_green') {
                gradeStyle = { backgroundColor: colors.primaryGreen, borderColor: colors.primaryGreen, borderWidth: 2 };
                gradeTextStyle = { color: colors.darkOverlay };
              } else if (subject.type === 'outline_green') {
                gradeStyle = { backgroundColor: colors.surface, borderColor: colors.primaryGreen, borderWidth: 2 };
                gradeTextStyle = { color: colors.primaryGreen };
              } else if (subject.type === 'solid_peach') {
                gradeStyle = { backgroundColor: colors.primaryPeach, borderColor: colors.primaryPeach, borderWidth: 2 };
                gradeTextStyle = { color: colors.textWhite };
              }

              return (
                <View key={index} style={styles.subjectCard}>
                  <View style={styles.subjectCardWatermark} />
                  
                  <View style={styles.subjectInfo}>
                    <Text style={styles.subjectCode}>{subject.code}</Text>
                    <Text style={styles.subjectName}>{subject.name}</Text>
                    
                    <View style={styles.marksContainer}>
                      <View style={styles.markItem}>
                        <Text style={styles.markLabel}>INTERNAL</Text>
                        <Text style={styles.markValue}>{subject.internal}</Text>
                      </View>
                      <View style={styles.markDivider} />
                      <View style={styles.markItem}>
                        <Text style={styles.markLabel}>EXTERNAL</Text>
                        <Text style={styles.markValue}>{subject.external}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={[styles.gradeCircle, gradeStyle]}>
                    <Text style={[styles.gradeText, gradeTextStyle]}>{subject.grade}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Overall Attendance */}
          <View style={styles.attendanceCard}>
            <View style={styles.attendanceHeader}>
              <Text style={styles.attendanceTitle}>Overall Attendance</Text>
              <Text style={styles.attendancePercent}>92%</Text>
            </View>
            
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '92%' }]} />
            </View>
            
            <Text style={styles.attendanceDesc}>
              Your attendance is well above the mandatory 75% requirement. You have maintained consistent participation throughout the semester.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <Notification visible={isNotificationVisible} onClose={() => setNotificationVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textWhite,
    fontSize: typography.h3,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Increased padding to ensure content isn't cut off by tab bar
  },
  gpaSummaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 16,
  },
  gpaCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 52,
    borderBottomLeftRadius: 52,
    borderTopRightRadius: 40,
    borderBottomRightRadius: 40,
    paddingVertical: 18,
    height: 104,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  gpaTextContent: {
    paddingLeft: 36,
    zIndex: 1,
  },
  gpaLabel: {
    color: colors.textGrey,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 1.5,
  },
  gpaValue: {
    color: colors.textWhite,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 24,
    marginTop: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  chartTitle: {
    color: colors.textWhite,
    fontSize: typography.h4,
    fontWeight: '800',
  },
  chartSubtitle: {
    color: colors.textGrey,
    fontSize: typography.caption,
    marginTop: 6,
    lineHeight: 18,
  },
  growthBadge: {
    alignItems: 'flex-end',
  },
  growthText: {
    color: colors.primaryGreen,
    fontSize: 14,
    fontWeight: '800',
  },
  growthLabel: {
    color: colors.primaryGreen,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(163, 230, 178, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    height: 130,
    width: 32,
    backgroundColor: '#202020',
    borderRadius: 16,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 16,
  },
  barFillInactive: {
    backgroundColor: '#2D2D2D',
  },
  barFillActive: {
    backgroundColor: colors.primaryGreen,
    shadowColor: colors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  barLabel: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  activeBarLabelText: {
    color: colors.primaryGreen,
  },
  insightCard: {
    backgroundColor: 'rgba(163, 230, 178, 0.05)',
    borderRadius: 30,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 178, 0.15)',
  },
  insightIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: colors.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  insightTextContainer: {
    flex: 1,
  },
  insightTitle: {
    color: colors.primaryGreen,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  insightDesc: {
    color: '#CCCCCC',
    fontSize: 12,
    lineHeight: 18,
  },
  insightClose: {
    padding: 8,
  },
  semesterScroll: {
    marginTop: 20,
  },
  semesterScrollContent: {
    gap: 12,
  },
  semTab: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
  },
  semTabInactive: {
    backgroundColor: '#1E1E1E',
  },
  semTabActive: {
    backgroundColor: colors.primaryGreen,
  },
  semTabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  semTabTextInactive: {
    color: colors.textGrey,
  },
  semTabTextActive: {
    color: colors.darkOverlay,
  },
  subjectsContainer: {
    marginTop: 12,
    gap: 16,
  },
  subjectCard: {
    backgroundColor: colors.surface,
    borderRadius: 32,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  subjectCardWatermark: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.02)',
    zIndex: 0,
  },
  subjectInfo: {
    flex: 1,
    zIndex: 1,
  },
  subjectCode: {
    color: colors.primaryPeach,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  subjectName: {
    color: colors.textWhite,
    fontSize: typography.h4,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  marksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  markItem: {
    flexDirection: 'column',
  },
  markLabel: {
    color: colors.textGrey,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  markValue: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '800',
  },
  markDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#333333',
    marginHorizontal: 20,
  },
  gradeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  gradeText: {
    fontSize: 26,
    fontWeight: '900',
  },
  attendanceCard: {
    backgroundColor: colors.surface,
    borderRadius: 32,
    padding: 24,
    marginTop: 24,
    marginBottom: 20,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  attendanceTitle: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '800',
  },
  attendancePercent: {
    color: colors.primaryGreen,
    fontSize: 18,
    fontWeight: '900',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primaryGreen,
    borderRadius: 4,
    shadowColor: colors.primaryGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  attendanceDesc: {
    color: '#AAAAAA',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  sectionTitle: {
    color: colors.textWhite,
    fontSize: typography.h4,
    fontWeight: '800',
  },
});

export default StudentAnalyticsDashboard;
