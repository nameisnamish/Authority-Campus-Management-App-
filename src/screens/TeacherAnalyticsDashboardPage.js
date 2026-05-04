import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Rect, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme';
import Notification from '../components/Notification';

const { width } = Dimensions.get('window');

const baseChartData = [
  { attendance: 88, performance: 78 },
  { attendance: 86, performance: 75 },
  { attendance: 92, performance: 82 },
  { attendance: 88, performance: 72 },
  { attendance: 83, performance: 67 },
  { attendance: 67, performance: 45, isNow: true },
  { attendance: null, performance: null },
  { attendance: null, performance: null },
  { attendance: 90, performance: 79 },
  { attendance: 85, performance: 74 },
  { attendance: 89, performance: 81 },
  { attendance: 87, performance: 71 },
  { attendance: 82, performance: 66 },
  { attendance: 66, performance: 44 },
  { attendance: null, performance: null },
  { attendance: null, performance: null },
  { attendance: 91, performance: 80 },
  { attendance: 84, performance: 73 },
  { attendance: 88, performance: 80 },
  { attendance: 86, performance: 70 },
];

const students = [
  {
    id: '1',
    name: 'Alex Mercer',
    usn: '4NI19CS004',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: '2',
    name: 'Sarah Connor',
    usn: '4NI19CS082',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
];

const subjects = ['Overall', 'Mathematics', 'Physics', 'Chemistry', 'English'];

export default function TeacherAnalyticsDashboardPage() {
  const [activeTab, setActiveTab] = useState('ATTENDANCE');
  const [isNotificationVisible, setNotificationVisible] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [timeType, setTimeType] = useState('WEEKS'); // 'WEEKS' or 'MONTHS'
  const [timeCount, setTimeCount] = useState(8); // Number of weeks or months
  const [selectedSubject, setSelectedSubject] = useState('Overall');
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showTimeTypeDropdown, setShowTimeTypeDropdown] = useState(false);
  const [showTimeCountDropdown, setShowTimeCountDropdown] = useState(false);
  const horizontalScrollRef = useRef(null);
  const weeksPerView = 4; // Show 4 weeks/months at a time
  
  // Chart dimensions
  const chartHeight = 220;
  const paddingX = 15;
  const barWidth = 18;
  const barGap = 35; // Gap between bars
  const chartWidth = weeksPerView * (barWidth + barGap) + paddingX * 2;
  const maxVal = 100;
  
  // Generate labels based on time type
  const generateChartData = () => {
    return baseChartData.slice(0, timeCount).map((data, i) => ({
      ...data,
      label: timeType === 'WEEKS' ? `W${i + 1}` : `M${i + 1}`,
    }));
  };
  
  const filteredChartData = generateChartData();
  
  // Get visible items based on scroll
  const startIndex = Math.floor(scrollOffset / (barWidth + barGap));
  const visibleData = filteredChartData.slice(startIndex, startIndex + weeksPerView);
  
  const getX = (index) => paddingX + index * (barWidth + barGap) + barWidth / 2;
  const getY = (val) => chartHeight - (val / maxVal) * chartHeight;

  let pathString = '';
  visibleData.forEach((d, i) => {
    if (d.performance === null) return;
    const x = getX(i);
    const y = getY(d.performance);
    if (pathString === '') pathString += `M ${x} ${y} `;
    else pathString += `L ${x} ${y} `;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        <TouchableOpacity style={styles.bellIcon} onPress={() => setNotificationVisible(true)}>
          <Ionicons name="notifications-outline" size={24} color={colors.textGrey} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Subject Selection */}
        <View style={styles.subjectSelectorContainer}>
          <TouchableOpacity 
            style={styles.subjectBtn}
            onPress={() => setShowSubjectDropdown(!showSubjectDropdown)}
          >
            <Text style={styles.subjectBtnText}>{selectedSubject}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.primaryGreen} />
          </TouchableOpacity>

          {showSubjectDropdown && (
            <View style={styles.subjectDropdownMenu}>
              {subjects.map((subject) => (
                <TouchableOpacity 
                  key={subject}
                  style={[styles.dropdownItem, selectedSubject === subject && styles.activeDropdownItem]}
                  onPress={() => { setSelectedSubject(subject); setShowSubjectDropdown(false); }}
                >
                  <Text style={[styles.dropdownItemText, selectedSubject === subject && styles.activeDropdownItemText]}>
                    {subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Chart Section */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.dropdownsContainer}>
              {/* Time Type Dropdown */}
              <View style={styles.dropdownWrapper}>
                <TouchableOpacity 
                  style={styles.dropdownBtn}
                  onPress={() => {
                    setShowTimeTypeDropdown(!showTimeTypeDropdown);
                    setShowTimeCountDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownBtnText}>{timeType}</Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textWhite} />
                </TouchableOpacity>

                {showTimeTypeDropdown && (
                  <View style={styles.dropdownMenu}>
                    <TouchableOpacity 
                      style={styles.dropdownItem}
                      onPress={() => { setTimeType('WEEKS'); setShowTimeTypeDropdown(false); }}
                    >
                      <Text style={styles.dropdownItemText}>Weeks</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.dropdownItem}
                      onPress={() => { setTimeType('MONTHS'); setShowTimeTypeDropdown(false); }}
                    >
                      <Text style={styles.dropdownItemText}>Months</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Time Count Dropdown */}
              <View style={styles.dropdownWrapper}>
                <TouchableOpacity 
                  style={styles.dropdownBtn}
                  onPress={() => {
                    setShowTimeCountDropdown(!showTimeCountDropdown);
                    setShowTimeTypeDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownBtnText}>{timeCount}</Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textWhite} />
                </TouchableOpacity>

                {showTimeCountDropdown && (
                  <View style={styles.dropdownMenu}>
                    {[4, 6, 8, 12, 16, 20].map((num) => (
                      <TouchableOpacity 
                        key={num}
                        style={styles.dropdownItem}
                        onPress={() => { setTimeCount(num); setShowTimeCountDropdown(false); setScrollOffset(0); }}
                      >
                        <Text style={styles.dropdownItemText}>{num}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendSquare, { backgroundColor: '#cce5e5' }]} />
                <Text style={styles.legendText}>Attendance</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primaryPeach }]} />
                <View style={[styles.legendLine, { backgroundColor: colors.primaryPeach }]} />
                <View style={[styles.legendDot, { backgroundColor: colors.primaryPeach }]} />
                <Text style={styles.legendText}>Performance</Text>
              </View>
            </View>
          </View>

          {/* Chart Area */}
          <View style={styles.chartAreaWrapper}>
            {/* Left Y Axis Labels - Static */}
            <View style={styles.yAxisLabelsStatic}>
              <Text style={styles.yAxisLabel}>100</Text>
              <Text style={styles.yAxisLabel}>75</Text>
              <Text style={styles.yAxisLabel}>50</Text>
              <Text style={styles.yAxisLabel}>25</Text>
              <Text style={styles.yAxisLabel}>0</Text>
            </View>

            {/* Scrollable Chart Content */}
            <ScrollView 
              ref={horizontalScrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(e) => setScrollOffset(e.nativeEvent.contentOffset.x)}
            >
              <View style={styles.chartArea}>
                <View style={styles.chartContent}>
                  <Svg width={Math.max(chartWidth, filteredChartData.length * (barWidth + barGap) + paddingX * 2)} height={250}>
                    {visibleData.map((d, i) => {
                      const x = paddingX + i * (barWidth + barGap);
                      const hasData = d.attendance !== null;
                      const barHeight = hasData ? (d.attendance / maxVal) * chartHeight : 0;
                      const y = hasData ? chartHeight - barHeight : chartHeight;
                      
                      return (
                        <React.Fragment key={`data-${i}`}>
                          {/* NOW Indicator Line */}
                          {d.isNow && (
                            <Line 
                              x1={x + barWidth/2} 
                              y1={0} 
                              x2={x + barWidth/2} 
                              y2={chartHeight} 
                              stroke="#A3E6B2" 
                              strokeWidth="2" 
                              strokeDasharray="4 4" 
                            />
                          )}
                          
                          {/* Bar or waves for empty */}
                          {hasData ? (
                            <Rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={barHeight}
                              rx={barWidth/2}
                              fill={d.isNow ? '#4a5b5c' : '#575f66'}
                            />
                          ) : (
                            <SvgText
                              x={x + barWidth/2}
                              y={chartHeight - 4}
                              fill="#3a3f45"
                              fontSize="14"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              ~~~
                            </SvgText>
                          )}
                          
                          {/* X Label */}
                          <SvgText
                            x={x + barWidth/2}
                            y={chartHeight + 20}
                            fill={d.isNow ? '#A3E6B2' : '#ECECEC'}
                            fontSize="12"
                            fontWeight="500"
                            textAnchor="middle"
                          >
                            {d.label}
                          </SvgText>
                        </React.Fragment>
                      );
                    })}

                    {/* Line & Dots rendering overlay with SVG */}
                    <Path d={pathString} fill="none" stroke={colors.primaryPeach} strokeWidth="4" />
                    {visibleData.map((d, i) => {
                      if (d.performance === null) return null;
                      return (
                        <Circle 
                          key={`dot-${i}`}
                          cx={paddingX + i * (barWidth + barGap) + barWidth / 2} 
                          cy={getY(d.performance)} 
                          r="5" 
                          fill={colors.primaryPeach} 
                          stroke="#111315" 
                          strokeWidth="2" 
                        />
                      );
                    })}
                  </Svg>
                </View>
              </View>
            </ScrollView>
            
            {/* Right Y Axis Labels - Static */}
            <View style={[styles.yAxisLabelsStatic, { alignItems: 'flex-end' }]}>
              <Text style={styles.yAxisLabelOrange}>100</Text>
              <Text style={styles.yAxisLabelOrange}>75</Text>
              <Text style={styles.yAxisLabelOrange}>50</Text>
              <Text style={styles.yAxisLabelOrange}>25</Text>
              <Text style={styles.yAxisLabelOrange}>0</Text>
            </View>
          </View>

          {/* Insight Pill */}
          <View style={styles.insightBox}>
            <Text style={styles.insightIcon}>💡</Text>
            <Text style={styles.insightText}>Insight: Attendance dropped in W6 due to Midterms.</Text>
          </View>

          {/* Scroll Indicator */}
          <View style={styles.scrollIndicator}>
            <Text style={styles.scrollIndicatorText}>
              Viewing {Math.min(weeksPerView, Math.max(0, filteredChartData.length - startIndex))} of {filteredChartData.length} {timeType}
            </Text>
          </View>
        </View>

        {/* List Section */}
        <View style={styles.listSection}>
          <View style={styles.tabsContainer}>
            <TouchableOpacity onPress={() => setActiveTab('ATTENDANCE')} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === 'ATTENDANCE' && styles.activeTabText]}>ATTENDANCE</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('GRADE')} style={styles.tab}>
              <Text style={[styles.tabText, activeTab === 'GRADE' && styles.activeTabText]}>GRADE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabBadge}>
              <Text style={styles.tabText}>ALERTS (3)</Text>
            </TouchableOpacity>
          </View>

          {students.map((student) => (
            <View key={student.id} style={styles.studentItem}>
              <Image source={{ uri: student.avatar }} style={styles.studentAvatar} />
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentUsn}>USN: {student.usn}</Text>
              </View>
              <TouchableOpacity style={styles.mailButton}>
                <Ionicons name="mail" size={20} color={colors.background} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <Notification visible={isNotificationVisible} onClose={() => setNotificationVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Very dark/black background from image
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 15,
  },
  bellIcon: {
    padding: 5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  chartCard: {
    backgroundColor: '#111315', 
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    zIndex: 1,
  },
  subjectSelectorContainer: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 200,
  },
  subjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111315',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  subjectBtnText: {
    color: colors.primaryGreen,
    fontSize: 14,
    fontWeight: '600',
  },
  subjectDropdownMenu: {
    backgroundColor: '#1C1F22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 2000,
  },
  dropdownsContainer: {
    flexDirection: 'row',
    gap: 12,
    zIndex: 100,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 10,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1F22',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dropdownBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    backgroundColor: '#1C1F22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 1000,
    minWidth: 110,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  dropdownItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  activeDropdownItem: {
    backgroundColor: '#2A2D30',
  },
  dropdownItemText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  activeDropdownItemText: {
    color: colors.primaryGreen,
    fontWeight: '600',
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 6,
  },
  legendDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legendLine: {
    width: 6,
    height: 2,
  },
  legendText: {
    color: '#ECECEC',
    fontSize: 10,
    marginLeft: 4,
  },
  chartArea: {
    flexDirection: 'row',
    height: 250,
  },
  chartAreaWrapper: {
    flexDirection: 'row',
    height: 250,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    width: 25,
    height: 250,
    paddingBottom: 0,
  },
  yAxisLabelsStatic: {
    justifyContent: 'space-between',
    width: 30,
    height: 250,
    paddingBottom: 0,
  },
  yAxisLabel: {
    color: '#ECECEC',
    fontSize: 10,
    textAlign: 'left',
  },
  yAxisLabelOrange: {
    color: colors.primaryPeach,
    fontSize: 10,
    textAlign: 'right',
  },
  chartContent: {
    flex: 1,
    marginLeft: 5,
  },
  insightBox: {
    flexDirection: 'row',
    backgroundColor: '#1C1F22',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 15,
  },
  insightIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  insightText: {
    color: '#ECECEC',
    fontSize: 12,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 25,
    backgroundColor: '#111315',
    marginRight: 10, // add logic for last item if more than 2
  },
  attendanceStatCard: {
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 178, 0.3)', // subtle green border
  },
  marksStatCard: {
    borderWidth: 1,
    borderColor: '#333',
  },
  statValueGreen: {
    fontSize: 26,
    fontWeight: '800',
    color: '#A3E6B2',
    marginRight: 6,
  },
  statValueWhite: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 6,
  },
  statLabel: {
    color: '#A0A0A0',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  listSection: {
    marginTop: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  tab: {
    marginRight: 20,
    paddingBottom: 4,
  },
  tabText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: '#A3E6B2',
  },
  tabBadge: {
    marginLeft: 'auto', // push to far right
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111315',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  studentUsn: {
    color: '#A0A0A0',
    fontSize: 12,
  },
  mailButton: {
    backgroundColor: '#A3E6B2',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollIndicator: {
    marginTop: 15,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#1C1F22',
    borderRadius: 12,
  },
  scrollIndicatorText: {
    color: '#A3E6B2',
    fontSize: 12,
    fontWeight: '600',
  },
});
