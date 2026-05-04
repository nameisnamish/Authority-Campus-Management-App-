import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import Notification from '../components/Notification';
import { useAuth } from '../hooks/useAuth';
import { useCache } from '../hooks/useCache';
import { Teacher_profile_API_ROUTES } from '../lib/constants';
import { DATA_SCHEMAS } from '../lib/dataSchemas';
import { normalizeProfileData } from '../utils/dataNormalizers';
import { getAccessToken } from '../utils/tokenStorage';
export default function TeacherProfilePage({ navigation }) {
  const { logout, isLoading } = useAuth();
  const { getCachedData, setCachedData, clearAllCache } = useCache();
  
  // Profile data states
  const [profileData, setProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);
  
  // Editable data states
  const [isInOffice, setIsInOffice] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [location, setLocation] = useState('');
  const [cabin, setCabin] = useState('');
  const [officeHours, setOfficeHours] = useState('');
  
  const [tempLocation, setTempLocation] = useState('');
  const [tempCabin, setTempCabin] = useState('');
  const [tempOfficeHours, setTempOfficeHours] = useState('');
  const [isNotificationVisible, setNotificationVisible] = useState(false);

  // Fetch teacher profile data
  useEffect(() => {
    fetchTeacherProfile();
  }, []);

  const fetchTeacherProfile = async () => {
    try {
      setIsLoadingProfile(true);
      setProfileError(null);

      // 1. Check cache first
      const cachedProfile = getCachedData(
        DATA_SCHEMAS.TEACHER_PROFILE.cacheKey
      );

      if (cachedProfile) {
        // Use cached data
        setProfileData(cachedProfile);
        setLocation(cachedProfile.location?.displayText || '');
        setCabin(cachedProfile.cabin?.displayText || '');
        setOfficeHours(cachedProfile.officeHours?.displayText || '');
        setIsInOffice(cachedProfile.status?.isInOffice ?? true);
        setIsDarkTheme(cachedProfile.status?.isDarkThemeEnabled ?? true);
        setIsLoadingProfile(false);
        return;
      }

      // 2. Not in cache, fetch from API
      const url = Teacher_profile_API_ROUTES.TEACHER_PROFILE;
      const token = getAccessToken();
      
      console.log('📡 Fetching profile with JWT token:', token ? '✅ Present' : '❌ Missing');
      console.log('🔗 API URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'ReactNative',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Normalize API data to standard format
        const normalizedData = normalizeProfileData(result);

        // 3. Cache the normalized data
        setCachedData(
          DATA_SCHEMAS.TEACHER_PROFILE.cacheKey,
          normalizedData
        );

        // Use the data
        setProfileData(normalizedData);
        setLocation(normalizedData.location?.displayText || '');
        setCabin(normalizedData.cabin?.displayText || '');
        setOfficeHours(normalizedData.officeHours?.displayText || '');
        setIsInOffice(normalizedData.status?.isInOffice ?? true);
        setIsDarkTheme(normalizedData.status?.isDarkThemeEnabled ?? true);
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileError(error.message);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Get display name with title
  const getDisplayName = () => {
    if (!profileData) return '';
    const title = profileData.title || '';
    const firstName = profileData.firstName || '';
    return `${title} ${firstName}`.trim();
  };

  const getProfileImage = () => {
    if (profileData?.profileImage) {
      return { uri: profileData.profileImage };
    }
    return null; // We'll handle fallback in the render section
  };

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [editType, setEditType] = useState(null); // 'location' or 'hours'

  const handleLogout = async () => {
    try {
      // Clear all cached data before logout
      clearAllCache();
      
      const result = await logout();
      if (result.success) {
        // Navigation back to login will be handled automatically by App.js RootNavigator
        // because AuthContext will update isSignedIn to false
        console.log('Logout successful');
      } else {
        Alert.alert('Error', result.error || 'Logout failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An error occurred');
    }
  };

  const openEditModal = (type) => {
    setEditType(type);
    if (type === 'location') {
      setTempLocation(location);
      setTempCabin(cabin);
    } else if (type === 'hours') {
      setTempOfficeHours(officeHours);
    }
    setEditModalVisible(true);
  };

  const saveChanges = () => {
    if (editType === 'location') {
      const trimmedLocation = tempLocation.trim();
      const trimmedCabin = tempCabin.trim();
      if (!trimmedLocation || !trimmedCabin) {
        Alert.alert('Validation Error', 'Location and cabin cannot be empty');
        return;
      }
      setLocation(trimmedLocation);
      setCabin(trimmedCabin);
    } else if (editType === 'hours') {
      const trimmedHours = tempOfficeHours.trim();
      if (!trimmedHours) {
        Alert.alert('Validation Error', 'Office hours cannot be empty');
        return;
      }
      setOfficeHours(trimmedHours);
    }
    setEditModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {isLoadingProfile ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : profileError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.primaryPeach} />
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTeacherProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : profileData ? (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Academic Identity</Text>
          <TouchableOpacity onPress={() => setNotificationVisible(true)}>
            <Ionicons name="notifications-outline" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* Profile Avatar & Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarRingOuter}>
              {profileData.profileImage ? (
                <Image 
                  source={{ uri: profileData.profileImage }} 
                  style={styles.avatarImage}
                  onError={(error) => {
                    console.log('Image failed to load:', error);
                  }}
                />
              ) : (
                <View style={styles.defaultAvatarWrapper}>
                  <Ionicons name="person-circle" size={140} color={colors.primaryGreen} />
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="pencil" size={14} color="#8D8D8D" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.name}>{getDisplayName()}</Text>
          <Text style={styles.designation}>{profileData.designation || ''}</Text>
          <Text style={styles.department}>{profileData.department || ''}</Text>
        </View>

        {/* Where to Find Me */}
        <View style={styles.sectionSpacing}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Where to Find Me</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, isInOffice && styles.toggleBtnActive]}
                onPress={() => setIsInOffice(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, isInOffice && styles.toggleTextActive]}>In Office</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !isInOffice && styles.toggleBtnDND]}
                onPress={() => setIsInOffice(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, !isInOffice && styles.toggleTextDND]}>DND</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cards */}
          <View style={styles.cardsContainer}>
            <TouchableOpacity 
              style={[styles.infoCard, styles.locationCardBorder]}
              onPress={() => openEditModal('location')}
              activeOpacity={0.8}
              accessibilityLabel="Edit location and cabin"
              accessibilityRole="button"
            >
              <View style={[styles.iconCircle, styles.iconCircleGreen]}>
                <Ionicons name="business" size={20} color={colors.primaryGreen} />
              </View>
              <View style={styles.infoTextContainerWithEdit}>
                <Text style={styles.infoLabel}>LOCATION</Text>
                <Text style={styles.infoPrimary}>{location}</Text>
                <Text style={styles.infoSecondary}>{cabin}</Text>
              </View>
              <View style={styles.editIconContainer}>
                <Ionicons name="pencil-outline" size={18} color={colors.textGrey} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.infoCard, styles.hoursCardBorder]}
              onPress={() => openEditModal('hours')}
              activeOpacity={0.8}
              accessibilityLabel="Edit office hours"
              accessibilityRole="button"
            >
              <View style={[styles.iconCircle, styles.iconCircleOrange]}>
                <Ionicons name="time" size={20} color={colors.primaryPeach} />
              </View>
              <View style={styles.infoTextContainerWithEdit}>
                <Text style={styles.infoLabel}>OFFICE HOURS</Text>
                <Text style={styles.infoPrimary}>{officeHours}</Text>
              </View>
              <View style={styles.editIconContainer}>
                <Ionicons name="pencil-outline" size={18} color={colors.textGrey} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Details */}
        <View style={styles.sectionSpacing}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.accountCard}>
            <View style={styles.accountRow}>
              <View style={styles.accountIconBox}>
                <Ionicons name="at" size={22} color="#A0A0A0" />
              </View>
              <View style={styles.accountTextContainer}>
                <Text style={styles.accountLabel}>College Email</Text>
                <Text style={styles.accountValue}>{profileData.collegeEmail || 'N/A'}</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="copy-outline" size={18} color="#8D8D8D" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.accountRow}>
              <View style={styles.accountIconBox}>
                <Ionicons name="id-card-outline" size={22} color="#A0A0A0" />
              </View>
              <View style={styles.accountTextContainer}>
                <Text style={styles.accountLabel}>Employee ID</Text>
                <Text style={styles.accountValue}>{profileData.employeeId || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, styles.settingsTitle]}>App Settings</Text>

          <TouchableOpacity style={styles.settingsRowCard} activeOpacity={0.8} accessibilityLabel="Notification Preferences" accessibilityRole="button">
            <View style={[styles.settingsIconBg, styles.settingsIconBgOrange]}>
              <Ionicons name="notifications-outline" size={22} color={colors.primaryPeach} />
            </View>
            <Text style={styles.settingsText}>Notification Preferences</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textGrey} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingsRowCard, styles.settingsRowLast]} activeOpacity={0.8} accessibilityLabel="App Theme toggle" accessibilityRole="switch" accessibilityState={{ checked: isDarkTheme }}>
            <View style={[styles.settingsIconBg, styles.settingsIconBgWhite]}>
              <Ionicons name="moon" size={20} color={colors.textWhite} />
            </View>
            <Text style={styles.settingsText}>App Theme</Text>
            <Switch
              value={isDarkTheme}
              onValueChange={setIsDarkTheme}
              trackColor={{ false: colors.border, true: '#2E4B38' }}
              thumbColor={isDarkTheme ? colors.primaryGreen : '#D0D0D0'}
              accessible={false}
            />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={() => setLogoutModalVisible(true)} 
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <Ionicons name="log-out-outline" size={22} color="#FF7E6B" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>
      ) : null}

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        presentationStyle="overFullScreen"
        statusBarTranslucent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} accessibilityLabel="Close" accessibilityRole="button">
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editType === 'location' ? 'Edit Location' : 'Edit Office Hours'}
              </Text>
              <View style={{ width: 30 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
              {editType === 'location' ? (
                <>
                  <Text style={styles.modalLabel}>Location</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={tempLocation}
                    onChangeText={setTempLocation}
                    placeholder="Enter location"
                    placeholderTextColor={colors.textGrey}
                    selectionColor={colors.primaryGreen}
                  />
                  <Text style={[styles.modalLabel, { marginTop: 20 }]}>Cabin / Desk Number</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={tempCabin}
                    onChangeText={setTempCabin}
                    placeholder="Enter cabin number"
                    placeholderTextColor={colors.textGrey}
                    selectionColor={colors.primaryGreen}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.modalLabel}>Office Hours</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalInputMultiline]}
                    value={tempOfficeHours}
                    onChangeText={setTempOfficeHours}
                    placeholder="Enter office hours (e.g., Mon-Wed: 2:00 PM - 4:00 PM)"
                    placeholderTextColor={colors.textGrey}
                    selectionColor={colors.primaryGreen}
                    multiline={true}
                    numberOfLines={3}
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.8}
                accessibilityLabel="Cancel"
                accessibilityRole="button"
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={saveChanges}
                activeOpacity={0.8}
                accessibilityLabel="Save changes"
                accessibilityRole="button"
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.logoutModalContainer}>
          <View style={styles.logoutModalContent}>
            <View style={styles.logoutModalIcon}>
              <Ionicons name="log-out-outline" size={48} color="#FF7E6B" />
            </View>
            
            <Text style={styles.logoutModalTitle}>Logout?</Text>
            <Text style={styles.logoutModalMessage}>
              Are you sure you want to logout? You'll need to login again to access your account.
            </Text>
            
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity
                style={styles.logoutModalCancelBtn}
                onPress={() => setLogoutModalVisible(false)}
                disabled={isLoading}
              >
                <Text style={styles.logoutModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.logoutModalConfirmBtn}
                onPress={() => {
                  setLogoutModalVisible(false);
                  handleLogout();
                }}
                disabled={isLoading}
              >
                <Text style={styles.logoutModalConfirmText}>
                  {isLoading ? 'Logging out...' : 'Logout'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Notification visible={isNotificationVisible} onClose={() => setNotificationVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101010', // Darker background to match image exactly
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#101010',
  },
  loadingText: {
    color: colors.textWhite,
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#101010',
    paddingHorizontal: 20,
  },
  errorText: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: colors.primaryGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: colors.darkOverlay,
    fontSize: 16,
    fontWeight: '700',
  },
  defaultAvatarWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    color: colors.textWhite,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerCollege: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarRingOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 65,
  },
  editButton: {
    position: 'absolute',
    top: 4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    color: colors.textWhite,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 6,
  },
  designation: {
    color: colors.primaryPeach,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  department: {
    color: colors.textGrey,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 250,
  },
  sectionSpacing: {
    marginBottom: 32,
  },
  settingsSection: {
    marginBottom: 16,
  },
  settingsTitle: {
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.textWhite,
    fontSize: 20,
    fontWeight: '700',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 4,
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  toggleBtnActive: {
    backgroundColor: colors.primaryGreen,
  },
  toggleBtnDND: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textGrey,
  },
  toggleTextActive: {
    color: colors.darkOverlay,
  },
  toggleTextDND: {
    color: colors.textGrey,
  },
  cardsContainer: {
    gap: 12,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingVertical: 24,
  },
  locationCardBorder: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryGreen,
  },
  hoursCardBorder: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryPeach,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconCircleGreen: {
    backgroundColor: 'rgba(163,230,178,0.15)',
  },
  iconCircleOrange: {
    backgroundColor: 'rgba(255,174,136,0.15)',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTextContainerWithEdit: {
    flex: 1,
    marginRight: 12,
  },
  editIconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoLabel: {
    color: colors.textGrey,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoPrimary: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
  },
  infoSecondary: {
    color: colors.textGrey,
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  accountIconBox: {
    width: 30,
    alignItems: 'center',
    marginRight: 12,
  },
  accountTextContainer: {
    flex: 1,
  },
  accountLabel: {
    color: colors.textGrey,
    fontSize: 12,
    marginBottom: 4,
  },
  accountValue: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 42,
  },
  settingsRowCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  settingsRowLast: {
    marginBottom: 0,
  },
  settingsIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingsIconBgGreen: {
    backgroundColor: 'rgba(163,230,178,0.1)',
  },
  settingsIconBgOrange: {
    backgroundColor: 'rgba(255,174,136,0.1)',
  },
  settingsIconBgWhite: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  settingsText: {
    flex: 1,
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 174, 136, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 174, 136, 0.3)',
    borderRadius: 30,
    paddingVertical: 18,
    marginTop: 8,
  },
  logoutText: {
    color: colors.primaryPeach,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    margin: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 0,
    maxHeight: '85%',
    minHeight: 300,
    marginBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseText: {
    color: colors.textGrey,
    fontSize: 28,
    fontWeight: '700',
    padding: 4,
  },
  modalTitle: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  modalLabel: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textWhite,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingVertical: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    color: colors.textGrey,
    fontSize: 16,
    fontWeight: '700',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: colors.primaryGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    color: colors.darkOverlay,
    fontSize: 16,
    fontWeight: '700',
  },
  // Logout Modal Styles
  logoutModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  logoutModalIcon: {
    marginBottom: 20,
  },
  logoutModalTitle: {
    color: colors.textWhite,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  logoutModalMessage: {
    color: colors.textGrey,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 28,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  logoutModalCancelBtn: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutModalCancelText: {
    color: colors.textGrey,
    fontSize: 16,
    fontWeight: '700',
  },
  logoutModalConfirmBtn: {
    flex: 1,
    backgroundColor: '#FF7E6B',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutModalConfirmText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '700',
  },
});
