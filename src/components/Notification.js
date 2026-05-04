import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';

const { height } = Dimensions.get('window');

const dummyNotifications = [
  {
    id: '1',
    type: 'attendance',
    title: 'Low Attendance Alert',
    message: 'Your attendance in Data Science has dropped below 75%. Please attend upcoming classes to avoid penalty.',
    time: '2 hours ago',
    read: false,
    icon: 'warning-outline',
    color: '#FF6B6B'
  },
  {
    id: '2',
    type: 'grade',
    title: 'New Grade Posted',
    message: 'Your mid-term grade for Machine Learning has been published. You scored an A.',
    time: '5 hours ago',
    read: false,
    icon: 'school-outline',
    color: colors.primaryGreen
  },
  {
    id: '3',
    type: 'general',
    title: 'Semester Registration',
    message: 'Registration for Semester 7 opens next week. Please clear any pending dues before the deadline.',
    time: '1 day ago',
    read: true,
    icon: 'calendar-outline',
    color: colors.primaryPeach
  },
  {
    id: '4',
    type: 'system',
    title: 'System Maintenance',
    message: 'The student portal will be down for maintenance this Saturday from 2 AM to 4 AM.',
    time: '3 days ago',
    read: true,
    icon: 'construct-outline',
    color: colors.textGrey
  },
  {
    id: '5',
    type: 'attendance',
    title: 'Attendance Corrected',
    message: 'Your attendance for Mathematics on Oct 24 has been updated to Present.',
    time: '4 days ago',
    read: true,
    icon: 'checkmark-circle-outline',
    color: colors.primaryGreen
  }
];

const Notification = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState(dummyNotifications);
  const [activeTab, setActiveTab] = useState('All');

  const markAllAsRead = () => {
    Alert.alert(
      "Mark all as read?",
      "All your unread notifications will be marked as read.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: () => setNotifications(notifications.map(n => ({ ...n, read: true })))
        }
      ]
    );
  };

  const clearAll = () => {
    Alert.alert(
      "Clear all notifications?",
      "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive",
          onPress: () => setNotifications([])
        }
      ]
    );
  };

  const toggleRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const removeNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const filteredNotifications = activeTab === 'All' 
    ? notifications 
    : notifications.filter(n => !n.read);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.container}>
          {/* Drag Handle */}
          <View style={styles.handleBarContainer}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <View style={styles.headerRight}>
                {notifications.length > 0 && (
                  <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
                    <Text style={styles.clearBtnText}>Clear All</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.textWhite} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'All' && styles.activeTab]} 
                onPress={() => setActiveTab('All')}
              >
                <Text style={[styles.tabText, activeTab === 'All' && styles.activeTabText]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'Unread' && styles.activeTab]} 
                onPress={() => setActiveTab('Unread')}
              >
                <Text style={[styles.tabText, activeTab === 'Unread' && styles.activeTabText]}>
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* List */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {filteredNotifications.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="notifications-off-outline" size={80} color={colors.border} />
                </View>
                <Text style={styles.emptyStateText}>
                  {activeTab === 'Unread' ? 'No unread notifications' : 'All caught up!'}
                </Text>
                <Text style={styles.emptyStateSub}>
                  {activeTab === 'Unread' 
                    ? 'Check the "All" tab for your history' 
                    : 'We\'ll notify you when something important happens'}
                </Text>
              </View>
            ) : (
              <>
                {/* Grouping Logic */}
                {['Today', 'Yesterday', 'Earlier'].map((group) => {
                  const groupNotifs = filteredNotifications.filter(n => {
                    if (group === 'Today') return n.time.includes('hours') || n.time.includes('minutes');
                    if (group === 'Yesterday') return n.time.includes('1 day ago');
                    if (group === 'Earlier') return n.time.includes('days ago') && !n.time.includes('1 day ago');
                    return false;
                  });

                  if (groupNotifs.length === 0) return null;

                  return (
                    <View key={group} style={styles.section}>
                      <Text style={styles.sectionTitle}>{group}</Text>
                      {groupNotifs.map((notif) => (
                        <TouchableOpacity 
                          key={notif.id} 
                          activeOpacity={0.7}
                          onPress={() => toggleRead(notif.id)}
                          style={[
                            styles.notificationCard, 
                            !notif.read && styles.unreadCard
                          ]}
                        >
                          <View style={[styles.iconContainer, { backgroundColor: `${notif.color}15` }]}>
                            <Ionicons name={notif.icon} size={24} color={notif.color} />
                          </View>
                          
                          <View style={styles.contentContainer}>
                            <View style={styles.titleRow}>
                              <Text style={[styles.title, !notif.read && styles.unreadTitle]} numberOfLines={1}>
                                {notif.title}
                              </Text>
                              <TouchableOpacity 
                                onPress={() => removeNotification(notif.id)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              >
                                <Ionicons name="close-circle-outline" size={18} color={colors.textGrey} />
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.messageText} numberOfLines={2}>
                              {notif.message}
                            </Text>
                            <View style={styles.cardFooter}>
                              <Text style={styles.timeText}>{notif.time}</Text>
                              {!notif.read && (
                                <View style={styles.unreadDot} />
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })}
              </>
            )}
            {notifications.length > 0 && unreadCount > 0 && activeTab === 'All' && (
              <TouchableOpacity onPress={markAllAsRead} style={styles.markAllFooter}>
                <Ionicons name="checkmark-done-outline" size={16} color={colors.primaryGreen} />
                <Text style={styles.markAllFooterText}>Mark all as read</Text>
              </TouchableOpacity>
            )}
            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.surface,
    height: height * 0.85,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  handleBarContainer: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  header: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textWhite,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 10,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  clearBtnText: {
    color: colors.textGrey,
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: colors.textGrey,
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.textWhite,
    fontWeight: '700',
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    opacity: 0.5,
    marginLeft: 4,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  unreadCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '800',
  },
  messageText: {
    color: colors.textGrey,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 11,
    fontWeight: '500',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryPeach,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateText: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyStateSub: {
    color: colors.textGrey,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  markAllFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
    paddingVertical: 12,
  },
  markAllFooterText: {
    color: colors.primaryGreen,
    fontSize: 13,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 60,
  },
});

export default Notification;
