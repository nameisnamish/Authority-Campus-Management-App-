import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  FlatList, 
  TextInput, 
  Image, 
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Alert
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import Notification from '../components/Notification';
import { useCache } from '../hooks/useCache';
import { Class_Enrollment_API_ROUTES } from '../lib/constants';
import { getAccessToken } from '../utils/tokenStorage';

const MOCK_SYLLABUS = [
  {
    id: '1',
    title: 'Process Management',
    description: 'Scheduling algorithms, PCB structure, and kernel mechanisms.',
    progress: 100,
    testConfigured: true,
    testSets: 3,
    testType: 'Technical MCQ',
    testDuration: '45 Mins',
    testFocus: 'Scheduling Logic',
    subtopics: Array.from({ length: 20 }, (_, i) => ({
      id: `1-${i+1}`,
      title: [
        'Process Concept', 'Process Scheduling', 'Operations on Processes', 'Interprocess Communication',
        'IPC in Shared-Memory Systems', 'IPC in Message-Passing Systems', 'Examples of IPC Systems',
        'Communication in Client-Server Systems', 'Threads Overview', 'Multicore Programming',
        'Multithreading Models', 'Thread Libraries', 'Implicit Threading', 'Threading Issues',
        'Basic Concepts', 'Scheduling Criteria', 'Scheduling Algorithms', 'Thread Scheduling',
        'Multi-Processor Scheduling', 'Real-Time CPU Scheduling'
      ][i] || `Advanced Topic ${i+1}`,
      status: 'completed'
    }))
  },
  {
    id: '2',
    title: 'Memory Management',
    description: 'Strategic allocation, protection, and virtual memory resource handling.',
    progress: 45,
    testConfigured: false,
    testSets: 0,
    testType: 'Problem Solving',
    testDuration: '60 Mins',
    testFocus: 'Paging & Segmentation',
    subtopics: Array.from({ length: 20 }, (_, i) => ({
      id: `2-${i+1}`,
      title: [
        'Background', 'Swapping', 'Contiguous Memory Allocation', 'Segmentation', 'Paging',
        'Structure of the Page Table', 'Example: Intel 32 and 64-bit Architectures', 'Background of Virtual Memory',
        'Demand Paging', 'Copy-on-Write', 'Page Replacement', 'Allocation of Frames', 'Thrashing',
        'Memory-Mapped Files', 'Allocating Kernel Memory', 'Other Considerations', 'Operating-System Examples',
        'Shared Memory', 'Performance of Demand Paging', 'Page-Replacement Algorithms'
      ][i] || `Memory Topic ${i+1}`,
      status: i < 9 ? 'completed' : i === 9 ? 'current' : 'pending'
    }))
  },
  {
    id: '3',
    title: 'File Systems',
    description: 'Disk structures, directory implementation, and allocation methods.',
    progress: 0,
    testConfigured: false,
    testSets: 0,
    testType: 'Concept Assessment',
    testDuration: '30 Mins',
    testFocus: 'Allocation Methods',
    subtopics: Array.from({ length: 20 }, (_, i) => ({
      id: `3-${i+1}`,
      title: [
        'File Concept', 'Access Methods', 'Directory and Disk Structure', 'File-System Mounting',
        'File Sharing', 'Protection', 'File-System Structure', 'File-System Implementation',
        'Directory Implementation', 'Allocation Methods', 'Free-Space Management', 'Efficiency and Performance',
        'Recovery', 'NFS', 'The WAFL File System', 'Mass-Storage Structure', 'Disk Structure',
        'Disk Attachment', 'Disk Scheduling', 'Disk Management'
      ][i] || `File Topic ${i+1}`,
      status: 'pending'
    }))
  },
  {
    id: '4',
    title: 'I/O Systems',
    description: 'Hardware, kernel I/O subsystem, and performance bottlenecks.',
    progress: 0,
    testConfigured: false,
    testSets: 0,
    testType: 'System Integration',
    testDuration: '40 Mins',
    testFocus: 'Kernel I/O Subsystem',
    subtopics: Array.from({ length: 20 }, (_, i) => ({
      id: `4-${i+1}`,
      title: [
        'I/O Hardware', 'Application I/O Interface', 'Kernel I/O Subsystem', 'Transforming I/O Requests',
        'STREAMS', 'Performance', 'Disk Scheduling', 'Disk Management', 'Swap-Space Management',
        'RAID Structure', 'Stable-Storage Implementation', 'Tertiary-Storage Structure', 'Operating System Issues',
        'Performance Issues', 'I/O Hardware Overview', 'Interrupts', 'Direct Memory Access',
        'I/O Port Addresses', 'Status Register', 'Control Register'
      ][i] || `I/O Topic ${i+1}`,
      status: 'pending'
    }))
  },
  {
    id: '5',
    title: 'System Protection',
    description: 'Security policies, access matrices, and encryption protocols.',
    progress: 0,
    testConfigured: false,
    testSets: 0,
    testType: 'Security Audit',
    testDuration: '50 Mins',
    testFocus: 'Access Control',
    subtopics: Array.from({ length: 20 }, (_, i) => ({
      id: `5-${i+1}`,
      title: [
        'Goals of Protection', 'Principles of Protection', 'Domain of Protection', 'Access Matrix',
        'Implementation of Access Matrix', 'Access Control', 'Revocation of Access Rights',
        'Capability-Based Systems', 'Language-Based Protection', 'The Security Problem', 'Program Threats',
        'System and Network Threats', 'Cryptography as a Security Tool', 'User Authentication',
        'Implementing Security Defenses', 'Firewalling to Protect Systems', 'Computer-Security Classifications',
        'Case Studies', 'Encryption Algorithms', 'Public-Key Infrastructure'
      ][i] || `Security Topic ${i+1}`,
      status: 'pending'
    }))
  }
];


export default function TeacherSyllabusTestManager({ route, navigation }) {
  const { subject } = route.params || {};
  const [activeTab, setActiveTab] = useState('students'); // 1st tab: Students List
  const [expandedModule, setExpandedModule] = useState('2');
  const [isNotificationVisible, setNotificationVisible] = useState(false);
  
  // Student List State (Tab 1)
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentError, setStudentError] = useState(null);
  
  // Marks State (Tab 2)
  const EXAM_TYPES = [
    { id: 'cie1', name: 'CIE 1', max: '20' },
    { id: 'cie2', name: 'CIE 2', max: '25' },
    { id: 'cie3', name: 'CIE 3', max: '25' },
    { id: 'see', name: 'SEE', max: '30' },
  ];
  const [selectedExam, setSelectedExam] = useState(EXAM_TYPES[0]);
  const [testName, setTestName] = useState('');
  const [maxMarks, setMaxMarks] = useState(EXAM_TYPES[0].max);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Syllabus/Test State (Tab 3)
  const [questionSets, setQuestionSets] = useState(3);
  const [difficulty, setDifficulty] = useState('Medium');
  const [showFullSyllabus, setShowFullSyllabus] = useState({}); // { moduleId: boolean }

  const { getCachedData, setCachedData } = useCache();

  useEffect(() => {
    fetchStudentList();
  }, [subject]);

  const fetchStudentList = async () => {
    if (!subject?.subjectId) {
      setStudentError('Subject ID not found');
      return;
    }

    const cacheKey = `studentList_${subject.subjectId}`;
    const cachedStudents = getCachedData(cacheKey);
    
    if (cachedStudents) {
      setStudents(cachedStudents.students);
      setLoadingStudents(false);
      return;
    }

    try {
      setLoadingStudents(true);
      setStudentError(null);

      const subject_id = subject.subjectId;
      const section_id = subject.sectionId || '1';

      const apiUrl = `${Class_Enrollment_API_ROUTES.ENROLL}?subject_id=${subject_id}&section_id=${section_id}`;
      const token = getAccessToken();

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

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch students');
      }

      const transformedStudents = data.data.students.map(student => ({
        id: student.id,
        name: student.name,
        rollNumber: student.rollNumber,
        programName: student.programName,
        batchName: student.batchName,
        attendancePercentage: student.attendancePercentage,
        profileImage: student.profileImage,
        roll: `#${student.rollNumber}`,
        course: `${student.programName} • ${student.batchName}`,
        attendance: Math.round(student.attendancePercentage),
        image: student.profileImage || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      }));

      setStudents(transformedStudents);
      setCachedData(cacheKey, { ...data.data, students: transformedStudents });

    } catch (error) {
      console.error('Error fetching students:', error);
      setStudentError('Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv', 
          'text/comma-separated-values', 
          'application/csv', 
          'application/vnd.ms-excel', 
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/pdf',
          'image/png',
          'application/octet-stream' // Fallback for some Android file managers
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setUploadedFile(result.assets[0]);
        setIsFileUploaded(true);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick the document');
      console.error(err);
    }
  };

  const handleFilePublish = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    try {
      const token = await getAccessToken();
      const formData = new FormData();
      
      // Append file
      formData.append('file', {
        uri: uploadedFile.uri,
        name: uploadedFile.name,
        type: uploadedFile.mimeType || 'application/octet-stream',
      });

      // Append metadata
      formData.append('subject_id', subject?.subjectId);
      formData.append('exam_type', selectedExam.id);
      formData.append('max_marks', maxMarks);
      formData.append('test_name', testName || selectedExam.name);

      const response = await fetch(`${BASE_URL}/api/teacher/marks/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', `Marks for ${selectedExam.name} have been published successfully!`);
        setIsFileUploaded(false);
        setUploadedFile(null);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'An error occurred during upload');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBack = () => navigation.goBack();

  const handleTabChange = (tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  // Tab 1: Students/Attendance logic
  const renderStudentsTab = () => {
    const filteredStudents = students.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getAttendanceStyle = (percentage) => {
      if (percentage >= 80) return { color: colors.primaryGreen, borderColor: colors.primaryGreen };
      if (percentage >= 65 && percentage < 80) return { color: colors.primaryPeach, borderColor: colors.primaryPeach };
      return { color: '#ff6b6b', borderColor: '#ff6b6b' }; 
    };

    return (
      <View style={styles.tabContent}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textGrey} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search student..."
            placeholderTextColor={colors.textGrey}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loadingStudents ? (
          <ActivityIndicator size="large" color={colors.primaryGreen} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const attStyle = getAttendanceStyle(item.attendance);
              return (
                <TouchableOpacity 
                  style={styles.studentCard}
                  onPress={() => navigation.push('TeacherSubjectStudentAttendancePage', { student: item, subject })}
                >
                  <Image source={{ uri: item.image }} style={styles.studentAvatar} />
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{item.name}</Text>
                    <Text style={styles.studentRoll}>{item.roll}</Text>
                  </View>
                  <View style={[styles.attendanceBadge, { borderColor: attStyle.borderColor }]}>
                    <Text style={[styles.attendanceText, { color: attStyle.color }]}>{item.attendance}%</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.studentList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    );
  };

  // Tab 2: Marks Upload logic
  const renderMarksTab = () => {
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Marks Summary Section */}
        <View style={styles.marksSummaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>TOTAL STUDENTS</Text>
            <Text style={styles.summaryValue}>{students.length}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>PENDING ENTRIES</Text>
            <Text style={[styles.summaryValue, { color: colors.primaryPeach }]}>{Math.max(0, students.length - 12)}</Text>
          </View>
        </View>

        {/* Test Configuration Card */}
        <View style={styles.marksConfigCard}>
          <View style={styles.configHeader}>
            <Ionicons name="school-outline" size={18} color={colors.primaryGreen} />
            <Text style={styles.configHeaderText}>ASSESSMENT TYPE</Text>
          </View>

          {/* Exam Type Chips */}
          <View style={styles.examChipsContainer}>
            {EXAM_TYPES.map((type) => (
              <TouchableOpacity 
                key={type.id}
                style={[styles.examChip, selectedExam.id === type.id && styles.examChipActive]}
                onPress={() => {
                  setSelectedExam(type);
                  setMaxMarks(type.max);
                }}
              >
                <Text style={[styles.examChipText, selectedExam.id === type.id && styles.examChipTextActive]}>
                  {type.name}
                </Text>
                <Text style={[styles.examChipMax, selectedExam.id === type.id && styles.examChipMaxActive]}>
                  {type.max}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.marksInputRow}>
            <View style={[styles.marksInputGroup, { flex: 2 }]}>
              <Text style={styles.marksInputLabel}>CUSTOM TEST NAME (OPTIONAL)</Text>
              <TextInput 
                style={styles.marksTextInput}
                placeholder={`e.g. ${selectedExam.name} - Regular`}
                placeholderTextColor={colors.textGrey}
                value={testName}
                onChangeText={setTestName}
              />
            </View>
            <View style={[styles.marksInputGroup, { flex: 1 }]}>
              <Text style={styles.marksInputLabel}>EDIT WEIGHTAGE</Text>
              <TextInput 
                style={[styles.marksTextInput, { color: colors.primaryGreen, fontWeight: '800' }]}
                keyboardType="numeric"
                value={maxMarks}
                onChangeText={setMaxMarks}
              />
            </View>
          </View>

          {!isFileUploaded ? (
            <TouchableOpacity 
              style={styles.marksUploadBtn}
              onPress={handleFilePick}
            >
              <Ionicons name="cloud-upload" size={20} color={colors.textWhite} />
              <Text style={styles.marksUploadBtnText}>Import {selectedExam.name} Scores from File</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.fileUploadedContainer}>
              <View style={styles.fileInfoCard}>
                <Ionicons name="document-text" size={20} color={colors.primaryGreen} />
                <Text style={styles.fileNameText} numberOfLines={1}>{uploadedFile?.name}</Text>
                <TouchableOpacity onPress={() => {
                  setIsFileUploaded(false);
                  setUploadedFile(null);
                }}>
                  <Ionicons name="close-circle" size={20} color={colors.primaryPeach} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={[styles.filePublishBtn, isUploading && { opacity: 0.7 }]}
                onPress={handleFilePublish}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Text style={styles.filePublishBtnText}>Publish from Uploaded File</Text>
                    <Ionicons name="send" size={16} color="#000" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Manual Score Entry Section (Expandable) */}
        <TouchableOpacity 
          style={styles.expandableHeader}
          activeOpacity={0.7}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setShowManualEntry(!showManualEntry);
          }}
        >
          <View style={styles.expandableHeaderLeft}>
            <Ionicons 
              name={showManualEntry ? "chevron-down" : "chevron-forward"} 
              size={20} 
              color={colors.primaryGreen} 
            />
            <Text style={styles.marksListTitle}>Manual Score Entry</Text>
          </View>
          {showManualEntry && (
            <TouchableOpacity onPress={() => {/* logic to clear all fields */}}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {showManualEntry && (
          <View style={styles.manualEntryContainer}>
            <View style={styles.marksStudentList}>
              {students.slice(0, 10).map((student) => (
                <View key={student.id} style={styles.marksStudentCard}>
                  <View style={styles.studentMetaInfo}>
                    <View style={styles.studentInitialCircle}>
                      <Text style={styles.studentInitialText}>{student.name.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={styles.marksStudentName}>{student.name}</Text>
                      <Text style={styles.marksStudentRoll}>{student.rollNumber}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.scoreInputContainer}>
                    <TextInput 
                      style={styles.marksEntryField}
                      placeholder="00"
                      placeholderTextColor={colors.textGrey}
                      keyboardType="numeric"
                    />
                    <Text style={styles.outOfLabel}>/ {maxMarks}</Text>
                  </View>
                </View>
              ))}
            </View>
            
            <TouchableOpacity style={styles.manualPublishBtn}>
              <Text style={styles.manualPublishBtnText}>Save & Publish Manual Entries</Text>
              <Ionicons name="checkmark-circle-outline" size={18} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        {/* Professional Note (Always Visible) */}
        <View style={styles.professionalNoteContainer}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.primaryPeach} />
          <Text style={styles.professionalNoteText}>
            Note: Ensure accuracy when entering scores. Mistyped marks can significantly impact student analytics and grading history. Please review all entries before final publication.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  // Tab 3: Syllabus UI (Refactored to Learning Path)
  const toggleModule = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedModule(expandedModule === id ? null : id);
  };

  const renderModuleCard = (module) => {
    const isExpanded = expandedModule === module.id;
    const isCompleted = module.progress === 100;
    const isInProgress = module.progress > 0 && module.progress < 100;

    return (
      <View key={module.id} style={[styles.learningPathCard, isExpanded && styles.learningPathCardExpanded]}>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => toggleModule(module.id)}
          style={styles.lpHeader}
        >
          <View style={styles.lpHeaderLeft}>
            <View style={[
              styles.lpProgressCircle, 
              isCompleted && { borderColor: colors.primaryGreen },
              isInProgress && { borderColor: colors.primaryPeach }
            ]}>
              {isCompleted ? (
                <Ionicons name="checkmark" size={20} color={colors.primaryGreen} />
              ) : (
                <Text style={[styles.lpProgressPercent, isInProgress && { color: colors.primaryPeach }]}>
                  {module.progress}%
                </Text>
              )}
            </View>
            <View style={styles.lpTitleContainer}>
              <Text style={styles.lpModuleTitle}>{module.title}</Text>
              <Text style={styles.lpModuleSubTitle} numberOfLines={1}>{module.description}</Text>
            </View>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={22} 
            color={colors.textGrey} 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.lpExpandedContent}>
            {/* 1. Test Management Section (Moved to Top) */}
            <View style={styles.testManagementSection}>
              <View style={styles.testHeaderRow}>
                <View>
                  <Text style={styles.testSectionTitle}>Test Management</Text>
                  <Text style={styles.testSectionSubTitle}>{module.testType || 'Knowledge Assessment'}</Text>
                </View>
                <View style={[styles.testStatusBadge, module.testConfigured && styles.testStatusBadgeActive]}>
                  <Text style={[styles.testStatusText, module.testConfigured && styles.testStatusTextActive]}>
                    {module.testConfigured ? 'PUBLISHED' : 'PENDING'}
                  </Text>
                </View>
              </View>

              {module.testConfigured ? (
                <View style={styles.testActiveDetails}>
                  <View style={styles.testMetaGrid}>
                    <View style={styles.testMetaItem}>
                      <Ionicons name="time-outline" size={14} color={colors.textGrey} />
                      <Text style={styles.testMetaText}>{module.testDuration}</Text>
                    </View>
                    <View style={styles.testMetaItem}>
                      <Ionicons name="layers-outline" size={14} color={colors.textGrey} />
                      <Text style={styles.testMetaText}>{module.testSets} Sets</Text>
                    </View>
                    <View style={styles.testMetaItem}>
                      <Ionicons name="analytics-outline" size={14} color={colors.textGrey} />
                      <Text style={styles.testMetaText}>{module.testFocus}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity style={styles.fullAnalyticsBtn}>
                    <Ionicons name="bar-chart" size={18} color="#000" />
                    <Text style={styles.fullAnalyticsBtnText}>View Detailed Analytics</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.testConfigUI}>
                  <TouchableOpacity style={styles.lpConfigureTestButton}>
                    <Ionicons name="add-circle" size={24} color={colors.primaryGreen} />
                    <Text style={styles.lpConfigureTestText}>Configure Module Test</Text>
                  </TouchableOpacity>

                  <View style={styles.lpConfigOptionRow}>
                    <Text style={styles.lpConfigLabel}>NUMBER OF QUESTION SETS</Text>
                    <View style={styles.lpStepperContainer}>
                      <TouchableOpacity onPress={() => setQuestionSets(Math.max(1, questionSets - 1))} style={styles.lpStepButton}>
                        <Ionicons name="remove" size={18} color={colors.textGrey} />
                      </TouchableOpacity>
                      <Text style={styles.lpStepValue}>{questionSets}</Text>
                      <TouchableOpacity onPress={() => setQuestionSets(questionSets + 1)} style={styles.lpStepButton}>
                        <Ionicons name="add" size={18} color={colors.textGrey} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.lpConfigOptionRow}>
                    <Text style={styles.lpConfigLabel}>CATEGORY & DIFFICULTY</Text>
                    <View style={styles.lpMiniActionRow}>
                      <TouchableOpacity style={styles.lpMiniDropdown}>
                        <Text style={styles.lpMiniDropdownText}>Logic</Text>
                        <Ionicons name="chevron-down" size={14} color={colors.textGrey} />
                      </TouchableOpacity>
                      <View style={styles.lpMiniDifficulty}>
                        {['E', 'M', 'H'].map((lvl) => (
                          <TouchableOpacity 
                            key={lvl} 
                            onPress={() => setDifficulty(lvl === 'E' ? 'Easy' : lvl === 'M' ? 'Medium' : 'Hard')}
                            style={[styles.lpDiffDot, difficulty.startsWith(lvl) && styles.lpDiffDotActive]}
                          >
                            <Text style={[styles.lpDiffText, difficulty.startsWith(lvl) && styles.lpDiffTextActive]}>{lvl}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.lpPublishButton}>
                    <Text style={styles.lpPublishButtonText}>PUBLISH TEST</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.lpDivider} />

            {/* 2. Subtopics List (Optimized Display) */}
            <View style={styles.lpSubtopicsHeader}>
              <Text style={styles.lpSubtopicsTitle}>Learning Steps</Text>
              <Text style={styles.lpSubtopicsCount}>{module.subtopics.length} Topics</Text>
            </View>

            <View style={styles.lpSubtopicsList}>
              {module.subtopics.slice(0, showFullSyllabus[module.id] ? 20 : 5).map((sub, idx, arr) => (
                <View key={sub.id} style={styles.lpSubtopicItem}>
                  <View style={styles.lpSubtopicLeading}>
                    <View style={[
                      styles.lpSubtopicIndicator,
                      sub.status === 'completed' && styles.lpSubIndicatorDone,
                      sub.status === 'current' && styles.lpSubIndicatorCurrent
                    ]}>
                      {sub.status === 'completed' && <Ionicons name="checkmark" size={10} color="#000" />}
                      {sub.status === 'current' && <View style={styles.lpPulseDot} />}
                    </View>
                    {idx !== arr.length - 1 && <View style={styles.lpSubConnector} />}
                  </View>
                  <Text style={[
                    styles.lpSubtopicTitle,
                    sub.status === 'completed' && styles.lpSubTitleDone,
                    sub.status === 'current' && styles.lpSubTitleCurrent
                  ]}>
                    {sub.title}
                  </Text>
                </View>
              ))}
            </View>

            {module.subtopics.length > 5 && (
              <TouchableOpacity 
                style={styles.viewMoreTopicsBtn}
                onPress={() => setShowFullSyllabus({
                  ...showFullSyllabus,
                  [module.id]: !showFullSyllabus[module.id]
                })}
              >
                <Text style={styles.viewMoreTopicsText}>
                  {showFullSyllabus[module.id] ? 'Show Less' : `View All ${module.subtopics.length} Topics`}
                </Text>
                <Ionicons 
                  name={showFullSyllabus[module.id] ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={colors.primaryGreen} 
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderSyllabusTab = () => {
    const overallProgress = Math.round(MOCK_SYLLABUS.reduce((acc, m) => acc + m.progress, 0) / MOCK_SYLLABUS.length);

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Overall Progress Dashboard */}
        <View style={styles.lpDashboard}>
          <View style={styles.lpDashboardInfo}>
            <View>
              <Text style={styles.lpDashboardLabel}>SYLLABUS PROGRESS</Text>
              <Text style={styles.lpDashboardValue}>{overallProgress}%</Text>
            </View>
            <View style={styles.lpDashboardStats}>
              <View style={styles.lpMiniStat}>
                <Text style={styles.lpMiniStatVal}>1/3</Text>
                <Text style={styles.lpMiniStatLab}>MODULES</Text>
              </View>
            </View>
          </View>
          <View style={styles.lpProgressBarBg}>
            <View style={[styles.lpProgressBarFill, { width: `${overallProgress}%` }]} />
          </View>
        </View>

        <Text style={styles.lpSectionTitle}>Learning Path</Text>
        <View style={styles.lpContainer}>
          {MOCK_SYLLABUS.map(m => renderModuleCard(m))}
        </View>
      </ScrollView>
    );
  };

  const subjectTitle = subject?.title || 'Operating Systems';
  const subjectCode = subject?.subjectCode || 'CS402';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={26} color={colors.primaryGreen} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerRightButton} onPress={() => setNotificationVisible(true)}>
          <Ionicons name="notifications-outline" size={24} color={colors.textWhite} />
        </TouchableOpacity>
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>{subjectTitle}</Text>
        <Text style={styles.mainTitle}>{subjectCode}</Text>
      </View>

      {/* Custom Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'students' && styles.tabItemActive]} 
          onPress={() => handleTabChange('students')}
        >
          <Ionicons name="people" size={20} color={activeTab === 'students' ? colors.primaryGreen : colors.textGrey} />
          <Text style={[styles.tabLabel, activeTab === 'students' && styles.tabLabelActive]}>Students</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'marks' && styles.tabItemActive]} 
          onPress={() => handleTabChange('marks')}
        >
          <Ionicons name="document-text" size={20} color={activeTab === 'marks' ? colors.primaryGreen : colors.textGrey} />
          <Text style={[styles.tabLabel, activeTab === 'marks' && styles.tabLabelActive]}>Marks</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'syllabus' && styles.tabItemActive]} 
          onPress={() => handleTabChange('syllabus')}
        >
          <Ionicons name="layers" size={20} color={activeTab === 'syllabus' ? colors.primaryGreen : colors.textGrey} />
          <Text style={[styles.tabLabel, activeTab === 'syllabus' && styles.tabLabelActive]}>Syllabus</Text>
        </TouchableOpacity>
      </View>

      {/* Content Rendering */}
      <View style={styles.contentContainer}>
        {activeTab === 'students' && renderStudentsTab()}
        {activeTab === 'marks' && renderMarksTab()}
        {activeTab === 'syllabus' && renderSyllabusTab()}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryGreen,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  proText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
  headerRightButton: {
    padding: 4,
  },
  titleSection: {
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  currentSyllabusLabel: {
    color: colors.primaryGreen,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  mainTitle: {
    color: colors.textWhite,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#161616',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 6,
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 18,
    gap: 8,
  },
  tabItemActive: {
    backgroundColor: '#252525',
  },
  tabLabel: {
    color: colors.textGrey,
    fontSize: 14,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.primaryGreen,
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Students Tab Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.textWhite,
    fontSize: 14,
  },
  studentList: {
    paddingBottom: 40,
    gap: 12,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 20,
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  studentRoll: {
    color: colors.textGrey,
    fontSize: 12,
  },
  attendanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  attendanceText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Marks Tab Styles
  marksHeader: {
    marginBottom: 24,
  },
  marksTitle: {
    color: colors.textWhite,
    fontSize: 22,
    fontWeight: '800',
  },
  marksSubtitle: {
    color: colors.textGrey,
    fontSize: 14,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: colors.textGrey,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textWhite,
    fontSize: 15,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryPeach,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 10,
  },
  uploadButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 30,
  },
  listHeading: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  manualEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  manualEntryName: {
    flex: 1,
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '600',
  },
  marksInput: {
    backgroundColor: '#1E1E1E',
    width: 60,
    height: 40,
    borderRadius: 10,
    textAlign: 'center',
    color: colors.primaryGreen,
    fontWeight: '700',
    fontSize: 16,
  },
  maxMarksLabel: {
    color: colors.textGrey,
    fontSize: 14,
    marginLeft: 8,
  },
  saveMarksButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  saveMarksText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },

  // Learning Path Styles
  lpDashboard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  lpDashboardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  lpDashboardLabel: {
    color: colors.textGrey,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  lpDashboardValue: {
    color: colors.textWhite,
    fontSize: 40,
    fontWeight: '800',
  },
  lpDashboardStats: {
    alignItems: 'center',
  },
  lpMiniStat: {
    alignItems: 'center',
  },
  lpMiniStatVal: {
    color: colors.primaryGreen,
    fontSize: 20,
    fontWeight: '800',
  },
  lpMiniStatLab: {
    color: colors.textGrey,
    fontSize: 9,
    fontWeight: '700',
  },
  lpProgressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  lpProgressBarFill: {
    height: '100%',
    backgroundColor: colors.primaryGreen,
    borderRadius: 4,
  },
  lpSectionTitle: {
    color: colors.textWhite,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  lpContainer: {
    gap: 16,
    paddingBottom: 40,
  },
  learningPathCard: {
    backgroundColor: '#161616',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  learningPathCardExpanded: {
    borderColor: 'rgba(163, 230, 178, 0.3)',
    backgroundColor: '#1A1A1A',
  },
  lpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    justifyContent: 'space-between',
  },
  lpHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  lpProgressCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lpProgressPercent: {
    color: colors.textGrey,
    fontSize: 12,
    fontWeight: '800',
  },
  lpTitleContainer: {
    flex: 1,
  },
  lpModuleTitle: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
  },
  lpModuleSubTitle: {
    color: colors.textGrey,
    fontSize: 13,
    marginTop: 2,
  },
  lpExpandedContent: {
    padding: 20,
    paddingTop: 0,
  },
  lpSubtopicsList: {
    paddingLeft: 4,
    marginTop: 10,
  },
  lpSubtopicItem: {
    flexDirection: 'row',
    minHeight: 44,
  },
  lpSubtopicLeading: {
    width: 24,
    alignItems: 'center',
  },
  lpSubtopicIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    marginTop: 4,
  },
  lpSubIndicatorDone: {
    backgroundColor: colors.primaryGreen,
    borderColor: colors.primaryGreen,
  },
  lpSubIndicatorCurrent: {
    borderColor: colors.primaryPeach,
    borderWidth: 2,
  },
  lpPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryPeach,
  },
  lpSubConnector: {
    position: 'absolute',
    top: 22,
    bottom: -4,
    width: 1.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  lpSubtopicTitle: {
    flex: 1,
    color: colors.textGrey,
    fontSize: 14,
    marginLeft: 12,
    marginTop: 3,
  },
  lpSubTitleDone: {
    color: 'rgba(255,255,255,0.8)',
  },
  lpSubTitleCurrent: {
    color: colors.primaryPeach,
    fontWeight: '600',
  },
  lpDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 20,
  },
  testManagementSection: {
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 16,
  },
  testHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  testSectionTitle: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  testStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  testStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textGrey,
  },
  testConfiguredInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testInfoText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  manageAnalyticsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(163, 230, 178, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  manageAnalyticsText: {
    color: colors.primaryGreen,
    fontSize: 13,
    fontWeight: '700',
  },
  testSectionSubTitle: {
    color: colors.textGrey,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  testStatusBadgeActive: {
    backgroundColor: 'rgba(163, 230, 178, 0.15)',
    borderColor: 'rgba(163, 230, 178, 0.3)',
    borderWidth: 1,
  },
  testStatusTextActive: {
    color: colors.primaryGreen,
  },
  testActiveDetails: {
    gap: 16,
  },
  testMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 12,
  },
  testMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  testMetaText: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: '600',
  },
  fullAnalyticsBtn: {
    backgroundColor: colors.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    shadowColor: colors.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  fullAnalyticsBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
  lpConfigureTestButton: {
    backgroundColor: 'rgba(163, 230, 178, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 178, 0.3)',
  },
  lpConfigureTestText: {
    color: colors.primaryGreen,
    fontSize: 15,
    fontWeight: '800',
  },
  lpConfigOptionRow: {
    marginBottom: 16,
  },
  lpConfigLabel: {
    color: colors.textGrey,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 8,
  },
  lpStepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 4,
    alignSelf: 'flex-start',
  },
  lpStepButton: {
    width: 32,
    height: 32,
    backgroundColor: '#252525',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lpStepValue: {
    color: colors.primaryGreen,
    fontSize: 16,
    fontWeight: '800',
    marginHorizontal: 12,
  },
  lpMiniActionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  lpMiniDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  lpMiniDropdownText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  lpMiniDifficulty: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  lpDiffDot: {
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lpDiffDotActive: {
    backgroundColor: colors.primaryPeach,
  },
  lpDiffText: {
    color: colors.textGrey,
    fontSize: 11,
    fontWeight: '800',
  },
  lpDiffTextActive: {
    color: '#000',
  },
  lpPublishButton: {
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  lpPublishButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lpSubtopicsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  lpSubtopicsTitle: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  lpSubtopicsCount: {
    color: colors.textGrey,
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  viewMoreTopicsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
  },
  viewMoreTopicsText: {
    color: colors.primaryGreen,
    fontSize: 14,
    fontWeight: '700',
  },

  // Marks Tab Enhanced Styles
  marksSummaryContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  summaryLabel: {
    color: colors.textGrey,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  summaryValue: {
    color: colors.textWhite,
    fontSize: 24,
    fontWeight: '800',
  },
  marksConfigCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 178, 0.2)',
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  configHeaderText: {
    color: colors.primaryGreen,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  marksInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  marksInputGroup: {
    gap: 8,
  },
  examChipsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  examChip: {
    flex: 1,
    backgroundColor: '#121212',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  examChipActive: {
    backgroundColor: 'rgba(163, 230, 178, 0.1)',
    borderColor: colors.primaryGreen,
  },
  examChipText: {
    color: colors.textGrey,
    fontSize: 13,
    fontWeight: '800',
  },
  examChipTextActive: {
    color: colors.primaryGreen,
  },
  examChipMax: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  examChipMaxActive: {
    color: 'rgba(163, 230, 178, 0.6)',
  },
  marksInputLabel: {
    color: colors.textGrey,
    fontSize: 10,
    fontWeight: '800',
  },
  marksTextInput: {
    backgroundColor: '#121212',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textWhite,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  marksUploadBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  marksUploadBtnText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  marksListTitle: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '800',
  },
  clearAllText: {
    color: colors.primaryPeach,
    fontSize: 12,
    fontWeight: '700',
  },
  marksStudentList: {
    gap: 12,
    marginBottom: 30,
  },
  marksStudentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  studentMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studentInitialCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  studentInitialText: {
    color: colors.primaryPeach,
    fontSize: 16,
    fontWeight: '800',
  },
  professionalNoteContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 126, 103, 0.05)',
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 126, 103, 0.1)',
  },
  professionalNoteText: {
    flex: 1,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  marksStudentName: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  marksStudentRoll: {
    color: colors.textGrey,
    fontSize: 11,
    fontWeight: '600',
  },
  scoreInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  marksEntryField: {
    backgroundColor: '#121212',
    width: 60,
    height: 44,
    borderRadius: 12,
    textAlign: 'center',
    color: colors.primaryGreen,
    fontSize: 18,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: '#333',
  },
  outOfLabel: {
    color: colors.textGrey,
    fontSize: 12,
    fontWeight: '600',
  },
  saveMarksPremiumBtn: {
    backgroundColor: colors.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    gap: 12,
    alignSelf: 'center',
    width: '100%',
    shadowColor: colors.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 18,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  expandableHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  manualEntryContainer: {
    marginTop: 8,
    paddingBottom: 40,
  },
  manualPublishBtn: {
    backgroundColor: colors.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    marginTop: 20,
  },
  manualPublishBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
  fileUploadedContainer: {
    marginTop: 10,
    gap: 12,
  },
  fileInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  fileNameText: {
    flex: 1,
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  filePublishBtn: {
    backgroundColor: colors.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  filePublishBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
  saveMarksPremiumText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
