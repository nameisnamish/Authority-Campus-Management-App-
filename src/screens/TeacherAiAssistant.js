import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { useCache } from '../hooks/useCache';
import { DATA_SCHEMAS } from '../lib/dataSchemas';
import { AI_API_ROUTES } from '../lib/constants';
import { getAccessToken } from '../utils/tokenStorage';
import Notification from '../components/Notification';


const QUICK_ACTIONS = [
  { id: '1', text: 'Class Summary', icon: 'document-text-outline' },
  { id: '2', text: 'Schedule Helper', icon: 'calendar-outline' },
  { id: '3', text: 'Attendance Report', icon: 'stats-chart-outline' },
  { id: '4', text: 'Student Performance', icon: 'person-outline' },
];

// ─── Animated Message Bubble ───────────────────────────────────────────────
const MessageBubble = ({ message }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  const isUser = message.sender === 'user';

  return (
    <Animated.View
      style={[
        styles.messageWrapper,
        isUser ? styles.userMessageWrapper : styles.aiMessageWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={styles.messageAvatar}>
          <MaterialCommunityIcons name="robot" size={16} color={colors.primaryPeach} />
        </View>
      )}
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.aiMessageText]}>
          {message.text}
        </Text>
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.aiTimestamp]}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Animated.View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function TeacherAiAssistant() {
  const [isNotificationVisible, setNotificationVisible] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! I'm Authority AI — your personal academic assistant. How can I help you today?",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();

  // 1. Initialize Cache
  const { getCachedData } = useCache();

  // 2. Prepare Teacher Context from Cache
  const getTeacherContext = () => {
    try {
      const assignmentsData = getCachedData(DATA_SCHEMAS.ASSIGNMENTS.cacheKey);
      if (!assignmentsData || !assignmentsData.assignments) return [];

      return assignmentsData.assignments.map(a => ({
        subject_name: a.subject?.subject_name,
        subject_id: a.subject?.subject_id,
        section_name: a.section?.section_name,
        section_id: a.section?.section_id,
        batch_name: a.batch?.batch_name
      }));
    } catch (err) {
      console.error('Error extracting teacher context:', err);
      return [];
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    
    // Add user message to UI
    const userMessageId = Date.now().toString();
    setMessages(prev => [
      ...prev,
      { id: userMessageId, text, sender: 'user', timestamp: new Date() },
    ]);
    
    setInputText('');
    setIsTyping(true);

    try {
      const token = getAccessToken();
      const teacherContext = getTeacherContext();

      console.log('🚀 AI REQUEST PAYLOAD:', JSON.stringify({
        message: text,
        context: teacherContext,
      }, null, 2));

      const response = await fetch(AI_API_ROUTES.AI_CHAT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          message: text,
          context: teacherContext,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log("AI Status:", data.status);
      } else {
        console.error("AI Error:", data.error);
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: data.reply || data.message || data.status || "Request processed.",
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
    } catch (err) {


      console.error('AI Assistant Error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "I'm having trouble connecting to my brain right now. Please try again in a moment.",
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };


  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isTyping]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Scrollable area: header + welcome + messages ── */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header — matches Schedule & Dashboard pattern ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={{flexDirection: 'row', alignItems: 'flex-start', gap: 12}}>
                <MaterialCommunityIcons name="robot-happy" size={32} color={colors.primaryPeach} style={{marginTop: 4}} />
                <View>
                  <Text style={styles.headerTitle}>Authority AI</Text>
                </View>
              </View>
              <Text style={styles.headerSubtitle}>Your academic assistant</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton} onPress={() => setNotificationVisible(true)}>
              <Ionicons name="notifications-outline" size={24} color={colors.textWhite} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>

          {/* ── AI Identity card — shown only at start ── */}
          {messages.length === 1 && (
            <View style={styles.identityCard}>
              {/* Decorative shapes — same style as liveCard on Dashboard */}
              <View style={styles.shapeCircle1} />
              <View style={styles.shapeCircle2} />
              <View style={styles.shapeSquare1} />
              <View style={styles.shapeCircle3} />
              <View style={styles.shapeSquare2} />
              <View style={styles.shapeCircle4} />
              <View style={styles.shapeSquare3} />
              <View style={styles.shapeCircle5} />

              <View style={styles.identityHeaderRow}>
                <View style={styles.robotIconWrapper}>
                  <MaterialCommunityIcons name="robot-happy-outline" size={44} color={colors.primaryPeach} />
                </View>
                <View style={styles.identityTextContainer}>
                  <Text style={styles.identityTitle}>Hello! 👋</Text>
                  <Text style={styles.identitySubtitle}>
                    I can help you with attendance, schedules, student performance, and more.
                  </Text>
                </View>
              </View>

              {/* Quick Action chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {QUICK_ACTIONS.map(action => (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.chip}
                    onPress={() => setInputText(action.text)}
                  >
                    <Ionicons name={action.icon} size={14} color={colors.primaryGreen} />
                    <Text style={styles.chipText}>{action.text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Messages ── */}
          <View style={styles.messagesList}>
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isTyping && (
              <View style={[styles.messageWrapper, styles.aiMessageWrapper]}>
                <View style={styles.messageAvatar}>
                  <MaterialCommunityIcons name="robot" size={16} color={colors.primaryPeach} />
                </View>
                <View style={[styles.messageBubble, styles.aiBubble]}>
                  <View style={styles.typingRow}>
                    <ActivityIndicator size="small" color={colors.primaryGreen} />
                    <Text style={styles.typingText}>Thinking…</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* ── Input Bar ── */}
        <View style={styles.footer}>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="add-circle-outline" size={26} color={colors.textGrey} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Message Authority AI…"
              placeholderTextColor={colors.textGrey}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="mic-outline" size={24} color={colors.primaryPeach} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name="arrow-up"
                size={22}
                color={inputText.trim() ? colors.background : colors.textGrey}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Notification visible={isNotificationVisible} onClose={() => setNotificationVisible(false)} />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },

  // ── ScrollView ──
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },

  // ── Header — exactly matching Schedule & Dashboard ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  headerLeft: { flex: 1 },
  headerTitle: {
    color: colors.textWhite,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: colors.textGrey,
    fontSize: typography.body2,
    marginTop: 6,
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

  // ── Identity / welcome card ── styled like the liveCard on Dashboard
  identityCard: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 30,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  shapeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 174, 136, 0.05)',
    top: -80,
    right: -80,
  },
  shapeCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 174, 136, 0.3)',
    top: -15,
    left: -15,
    zIndex: 0,
  },
  shapeCircle3: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 174, 136, 0.28)',
    top: 30,
    right: 40,
    zIndex: 0,
  },
  shapeSquare1: {
    position: 'absolute',
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 174, 136, 0.25)',
    bottom: 20,
    right: 20,
    transform: [{ rotate: '45deg' }],
    zIndex: 0,
  },
  shapeSquare2: {
    position: 'absolute',
    width: 35,
    height: 35,
    backgroundColor: 'rgba(255, 174, 136, 0.3)',
    top: 100,
    left: 15,
    transform: [{ rotate: '30deg' }],
    zIndex: 0,
  },
  shapeCircle4: {
    position: 'absolute',
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'rgba(255, 174, 136, 0.26)',
    bottom: 90,
    right: -10,
    zIndex: 0,
  },
  shapeSquare3: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 174, 136, 0.22)',
    top: 10,
    right: 140,
    transform: [{ rotate: '60deg' }],
    zIndex: 0,
  },
  shapeCircle5: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 174, 136, 0.18)',
    bottom: -20,
    left: 40,
    zIndex: 0,
  },
  identityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  robotIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  identityTextContainer: {
    flex: 1,
    marginTop: 4,
  },
  identityTitle: {
    color: colors.darkOverlay,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  identitySubtitle: {
    color: '#1a3320',
    fontSize: typography.body2,
    lineHeight: 20,
    fontWeight: '500',
  },
  chipsRow: {
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.darkOverlay,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  chipText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Messages ──
  messagesList: {
    gap: 4,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '84%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiMessageWrapper: { alignSelf: 'flex-start' },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 22,
  },
  userBubble: {
    backgroundColor: colors.primaryPeach,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  userMessageText: { color: colors.darkOverlay, fontWeight: '600' },
  aiMessageText: { color: colors.textWhite, fontWeight: '400' },
  timestamp: { fontSize: 10, marginTop: 6, alignSelf: 'flex-end', fontWeight: '600' },
  userTimestamp: { color: 'rgba(0,0,0,0.35)' },
  aiTimestamp: { color: colors.textGrey },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typingText: {
    color: colors.textGrey,
    fontSize: 13,
    fontStyle: 'italic',
  },

  // ── Footer / input ──
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: colors.textWhite,
    fontSize: 15,
    maxHeight: 110,
    paddingHorizontal: 10,
    paddingVertical: 10,
    lineHeight: 21,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});
