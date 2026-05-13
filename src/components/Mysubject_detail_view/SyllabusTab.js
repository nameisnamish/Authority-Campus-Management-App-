import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutAnimation, Platform, UIManager, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

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

  return <Animated.View style={[style, { opacity: animatedValue, backgroundColor: 'rgba(255,255,255,0.05)' }]} />;
};

const SyllabusSkeleton = () => (
  <ScrollView contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
    {/* Progress Card Skeleton */}
    <View style={styles.dashboardCard}>
      <View style={styles.dashboardHeader}>
        <View>
          <SkeletonPlaceholder style={{ width: 100, height: 10, marginBottom: 8, borderRadius: 2 }} />
          <SkeletonPlaceholder style={{ width: 60, height: 32, borderRadius: 4 }} />
        </View>
        <View style={styles.dashboardStats}>
           <SkeletonPlaceholder style={{ width: 30, height: 20, borderRadius: 4 }} />
           <View style={styles.miniStatDivider} />
           <SkeletonPlaceholder style={{ width: 30, height: 20, borderRadius: 4 }} />
        </View>
      </View>
      <SkeletonPlaceholder style={{ width: '100%', height: 8, borderRadius: 4, marginTop: 10 }} />
    </View>

    <SkeletonPlaceholder style={{ width: 140, height: 20, marginBottom: 16, marginLeft: 4, borderRadius: 4 }} />
    
    {/* Module Cards Skeletons */}
    {[1, 2, 3, 4].map(i => (
      <View key={i} style={[styles.moduleCard, { marginBottom: 12 }]}>
        <View style={styles.moduleHeader}>
          <View style={styles.moduleHeaderLeft}>
            <SkeletonPlaceholder style={styles.progressCircle} />
            <View style={styles.titleContainer}>
              <SkeletonPlaceholder style={{ width: '60%', height: 16, borderRadius: 4, marginBottom: 8 }} />
              <SkeletonPlaceholder style={{ width: '80%', height: 12, borderRadius: 4 }} />
            </View>
          </View>
          <SkeletonPlaceholder style={{ width: 20, height: 20, borderRadius: 10 }} />
        </View>
      </View>
    ))}
  </ScrollView>
);

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

// ─── Mock Syllabus Data ───────────────────────────────────────────────
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

export default function SyllabusTab() {
  const [expandedModule, setExpandedModule] = useState('2');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for smooth transition
    const timer = setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const toggleModule = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedModule(expandedModule === id ? null : id);
  };

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

            <View style={styles.moduleMeta}>
              <Text style={styles.moduleDescription}>{module.description}</Text>
              <View style={styles.topicsCountRow}>
                <Ionicons name="list" size={14} color={colors.primaryGreen} />
                <Text style={styles.topicsCountText}>{module.subtopics.length} Total Topics</Text>
              </View>
            </View>

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

  const totalModules = MOCK_SYLLABUS.length;
  const completedModules = MOCK_SYLLABUS.filter(m => m.progress === 100).length;
  const overallProgress = (MOCK_SYLLABUS.reduce((acc, m) => acc + m.progress, 0) / (totalModules * 100)) * 100;

  if (loading) {
    return <SyllabusSkeleton />;
  }

  return (
    <ScrollView contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
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
}

const styles = StyleSheet.create({
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
});
