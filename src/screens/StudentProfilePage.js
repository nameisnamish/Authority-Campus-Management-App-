import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import Notification from '../components/Notification';
import { useAuth } from '../hooks/useAuth';
import LibraryQRScanner from '../components/LibraryQRScanner';
import LibraryCheckInModal from '../components/LibraryCheckInModal';
import FaceEnrollmentModal from '../components/FaceEnrollmentModal';
import { validateLibraryQR } from '../utils/libraryQRValidator';

export default function StudentProfilePage({ navigation }) {
  const { logout, isLoading } = useAuth();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [libraryQRScannerVisible, setLibraryQRScannerVisible] = useState(false);
  const [libraryCheckInModalVisible, setLibraryCheckInModalVisible] = useState(false);
  const [faceEnrollmentVisible, setFaceEnrollmentVisible] = useState(false);
  const [scannedQRSecret, setScannedQRSecret] = useState(null);
  const [isNotificationVisible, setNotificationVisible] = useState(false);

  // Mock student data - in a real app, this would come from a context or API
  const student = {
    name: 'Alex Johnson',
    usn: '1RV21CS001',
    residenceStatus: 'Hosteller',
    course: 'B.Tech Computer Science',
    email: 'alex.j@rvu.edu.in',
    avatar: null // Default icon will be used
  };

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (result.success) {
        setLogoutModalVisible(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleQRScanned = (qrData) => {
    console.log('[ProfilePage] QR Scanned:', qrData);
    // Pass the raw data to the modal so it can parse actions
    setScannedQRSecret(qrData); 
    setLibraryQRScannerVisible(false);
    setLibraryCheckInModalVisible(true);
  };

  const handleCloseCheckInModal = () => {
    setLibraryCheckInModalVisible(false);
    setScannedQRSecret(null);
  };

  const ProfileRow = ({ icon, label, value, hasChevron = true, onPress, color = colors.textWhite }) => (
    <TouchableOpacity 
      style={styles.profileRow} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowIconContainer}>
        <Ionicons name={icon} size={20} color={color === colors.primaryPeach ? color : colors.primaryGreen} />
      </View>
      <View style={styles.rowTextContainer}>
        {label && <Text style={styles.rowLabel}>{label}</Text>}
        <Text style={[styles.rowValue, { color }]}>{value}</Text>
      </View>
      {hasChevron && <Ionicons name="chevron-forward" size={18} color={colors.textGrey} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Academic Identity</Text>
        <TouchableOpacity onPress={() => setNotificationVisible(true)}>
          <Ionicons name="notifications-outline" size={24} color={colors.textWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarOutline}>
              <View style={styles.avatarImage}>
                <Ionicons name="person" size={80} color={colors.primaryGreen} />
              </View>
            </View>
            <TouchableOpacity style={styles.editIconBadge}>
              <Ionicons name="pencil" size={16} color={colors.textGrey} />
            </TouchableOpacity>
          </View>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.studentUsn}>{student.course}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>🏡 {student.residenceStatus}</Text>
          </View>
        </View>

        {/* Academic Details Card */}
        <Text style={styles.sectionHeader}>Account Details</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="at-outline" size={22} color={colors.textGrey} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>University Email</Text>
              <Text style={styles.detailValue}>{student.email}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="copy-outline" size={20} color={colors.textGrey} />
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="card-outline" size={22} color={colors.textGrey} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>USN / ID Number</Text>
              <Text style={styles.detailValue}>{student.usn}</Text>
            </View>
          </View>
        </View>

        {/* Library QR Scanner Banner */}
        <TouchableOpacity 
          style={styles.libraryScannerBanner} 
          activeOpacity={0.8}
          onPress={() => setLibraryQRScannerVisible(true)}
        >
          <View style={styles.libraryScannerContent}>
            <Text style={styles.libraryScannerIcon}>📚</Text>
            <Text style={styles.libraryScannerText}>Library QR Scanner</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textGrey} />
        </TouchableOpacity>

        {/* Tools & Settings */}
        <Text style={styles.sectionHeader}>Tools & Settings</Text>
        <View style={styles.settingsCard}>
          <ProfileRow 
            icon="camera-outline" 
            value="Update Face Enrollment" 
            onPress={() => setFaceEnrollmentVisible(true)} 
            color={colors.primaryPeach}
          />
          <View style={styles.divider} />
          <ProfileRow 
            icon="document-outline" 
            value="Make CV" 
            onPress={() => {}} 
          />
          <View style={styles.divider} />
          <ProfileRow 
            icon="briefcase-outline" 
            value="Apply for Jobs" 
            onPress={() => {}} 
          />
          <View style={styles.divider} />
          <ProfileRow 
            icon="settings-outline" 
            value="App Settings" 
            onPress={() => {}} 
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={() => setLogoutModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.primaryPeach} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="log-out-outline" size={48} color="#FF7E6B" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Logout?</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout? You'll need to login again to access your account.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.confirmBtn]} 
                onPress={handleLogout}
                disabled={isLoading}
              >
                <Text style={styles.confirmBtnText}>{isLoading ? 'Logging out...' : 'Logout'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Library QR Scanner Component */}
      <LibraryQRScanner
        visible={libraryQRScannerVisible}
        onClose={() => setLibraryQRScannerVisible(false)}
        onQRScanned={handleQRScanned}
      />

      {/* Library Check-In Modal Component */}
      <LibraryCheckInModal
        visible={libraryCheckInModalVisible}
        onClose={handleCloseCheckInModal}
        qrSecret={scannedQRSecret}
      />

      {/* Face Enrollment Component */}
      <FaceEnrollmentModal 
        visible={faceEnrollmentVisible}
        onClose={() => setFaceEnrollmentVisible(false)}
      />

      <Notification visible={isNotificationVisible} onClose={() => setNotificationVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Ultra dark background like the image
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textWhite,
    flex: 1,
    marginLeft: 12,
  },
  headerCollege: {
    fontSize: 14,
    color: colors.textWhite,
    fontWeight: '600',
    opacity: 0.8,
  },
  editButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarOutline: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(163,230,178,0.2)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textWhite,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  studentUsn: {
    fontSize: 16,
    color: colors.primaryPeach,
    fontWeight: '600',
    marginBottom: 10,
  },
  statusPill: {
    backgroundColor: 'rgba(163,230,178,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(163,230,178,0.3)',
  },
  statusPillText: {
    color: colors.primaryGreen,
    fontWeight: '700',
    fontSize: 12,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textWhite,
    marginTop: 25,
    marginBottom: 15,
  },
  detailsCard: {
    backgroundColor: '#151517',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  detailIconBox: {
    width: 30,
    alignItems: 'center',
    marginRight: 15,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textGrey,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 45,
  },
  libraryScannerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(163, 230, 178, 0.1)',
    padding: 24,
    borderRadius: 28,
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(163, 230, 178, 0.3)',
    justifyContent: 'space-between',
  },
  libraryScannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  libraryScannerIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  libraryScannerText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryGreen,
  },
  settingsCard: {
    backgroundColor: '#151517',
    borderRadius: 28,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rowIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowTextContainer: {
    flex: 1,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 174, 136, 0.08)',
    paddingVertical: 18,
    borderRadius: 30,
    marginTop: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 174, 136, 0.2)',
  },
  logoutText: {
    color: colors.primaryPeach,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 35,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalIcon: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textWhite,
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 15,
    color: colors.textGrey,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 15,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.border,
  },
  confirmBtn: {
    backgroundColor: colors.primaryPeach,
  },
  cancelBtnText: {
    color: colors.textWhite,
    fontWeight: '700',
  },
  confirmBtnText: {
    color: colors.darkOverlay,
    fontWeight: '700',
  },
});