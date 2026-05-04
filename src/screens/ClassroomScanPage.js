import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { Teacher_Attendance_API_ROUTES } from '../lib/constants';
import { getAccessToken } from '../utils/tokenStorage';

const SCAN_LABELS = ['left', 'center', 'right'];

export default function ClassroomScanPage({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos]             = useState([]);       // [{ uri, label }]
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [isModalReady, setIsModalReady]   = useState(false);
  const cameraRef = useRef(null);

  const currentIndex = photos.length;
  const currentLabel = SCAN_LABELS[currentIndex];
  const allCaptured  = photos.length === 3;

  const subjectName = route?.params?.subjectName ?? 'Operating Systems';
  const batch       = route?.params?.batch       ?? 'BATCH B';
  const timetableId = route?.params?.timetableId;

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  // ── Actions ────────────────────────────────────────────────────
  const takePicture = async () => {
    if (!cameraRef.current || allCaptured || !isCameraReady) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6, base64: false });
      if (photo?.uri) {
        setPhotos(prev => [...prev, { uri: photo.uri, label: currentLabel }]);
      }
    } catch (e) {
      Alert.alert('Capture Error', 'Could not take photo. Please try again.');
    }
  };

  const handleClear = () => setPhotos([]);

  const handleSubmit = async () => {
    if (!allCaptured) return;
    setIsSubmitting(true);

    try {
      const token = getAccessToken();

      if (!timetableId) {
        Alert.alert('Error', 'Missing session information. Please restart the scan.');
        setIsSubmitting(false);
        return;
      }

      if (!token) {
        Alert.alert('Error', 'Session expired. Please log in again.');
        setIsSubmitting(false);
        return;
      }

      console.log('📤 Preparing submission for Timetable ID:', timetableId);
      console.log('📸 Photos to upload:', photos.map(p => p.uri));

      const formData = new FormData();
      
      // 1. Append the timetable ID
      formData.append('timetable_id', timetableId.toString());

      // 2. Append the captured photos
      photos.slice(0, 3).forEach((photo, index) => {
        const filename = photo.uri.split('/').pop() || `class_photo_${index}.jpg`;
        
        console.log(`🖼️ Appending image ${index + 1}:`, filename);

        // React Native requires this specific object structure for files in FormData
        formData.append('image', {
          uri: photo.uri,
          name: filename,
          type: 'image/jpeg',
        });
      });

      console.log('📡 Sending POST request to:', Teacher_Attendance_API_ROUTES.SUBMIT);
      // 3. Send the Request
      const response = await fetch(Teacher_Attendance_API_ROUTES.SUBMIT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          // ⚠️ DO NOT set 'Content-Type': 'multipart/form-data' here!
          // Fetch will automatically set it AND generate the required boundary string.
        },
        body: formData,
      });

      const result = await response.json();
      console.log('Submission result:', result);

      if (response.ok) {
        setSuccessVisible(true);
      } else {
        Alert.alert(
          'Submission Failed', 
          result.message || result.error || 'The server encountered an error processing the scan.'
        );
      }
    } catch (error) {
      console.error("Submission failed:", error);
      Alert.alert('Network Error', 'Could not reach the server. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    setSuccessVisible(false);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    navigation.canGoBack() && navigation.goBack();
  };

  // ── Permission screens (mirror FaceEnrollmentModal style) ──────
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primaryPeach} style={{ flex: 1 }} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionBox}>
          <Ionicons name="camera-outline" size={60} color={colors.primaryPeach} />
          <Text style={styles.permTitle}>Camera Access Needed</Text>
          <Text style={styles.permSub}>
            The classroom scanner requires camera access to capture attendance photos.
          </Text>
          <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
            <Text style={styles.permButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main Render ────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ── Full-screen camera background ── */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        onCameraReady={() => setIsCameraReady(true)}
      />

      {/* ══════════ OVERLAY LAYER ══════════ */}

      {/* ── Top Header (absolute) ── */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            navigation.canGoBack() && navigation.goBack();
          }}
        >
          <Ionicons name="close" size={28} color={colors.textWhite} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Classroom Scan</Text>

        {/* right spacer to keep title centred */}
        <View style={styles.headerButton} />
      </SafeAreaView>

      {/* ── Camera overlay: subject + instruction, stacked in the middle of the live feed ── */}
      <View style={styles.overlayInstructions} pointerEvents="none">
        <View style={styles.subjectBadge}>
          <Text style={styles.subjectBadgeText}>{subjectName}  ·  {batch}</Text>
        </View>
        <View style={styles.instructionPill}>
          <Text style={styles.instructionPillText}>
            {allCaptured
              ? '✅  All photos captured!'
              : `📷  ${currentLabel.toUpperCase()} section`}
          </Text>
        </View>
      </View>

      {/* ══════════ BOTTOM CONTROL SHEET ══════════ */}
      <View style={styles.controlSection}>

        {/* Instruction text */}
        <Text style={styles.instructionText}>
          {allCaptured
            ? 'Review your photos and submit'
            : `Point the camera at the ${currentLabel} of the classroom`}
        </Text>

        {/* ── Photo slots (mirrors FaceEnrollmentModal exactly) ── */}
        <View style={styles.slotsContainer}>
          {SCAN_LABELS.map((label, index) => {
            const photo    = photos[index];
            const isActive = index === currentIndex;
            return (
              <View
                key={label}
                style={[
                  styles.slot,
                  isActive && { borderColor: colors.primaryPeach, borderStyle: 'solid' },
                ]}
              >
                {photo ? (
                  <Image source={{ uri: photo.uri }} style={styles.slotImage} />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons
                      name={
                        label === 'left'   ? 'return-down-back'
                        : label === 'center' ? 'scan-outline'
                        : 'return-down-forward'
                      }
                      size={24}
                      color={isActive ? colors.primaryPeach : colors.textGrey}
                    />
                    <Text style={[styles.slotLabel, isActive && { color: colors.primaryPeach }]}>
                      {label}
                    </Text>
                  </View>
                )}
                {photo && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primaryGreen} />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ── Action button area (mirrors FaceEnrollmentModal) ── */}
        <View style={styles.actionsContainer}>
          {!allCaptured ? (
            /* Capture shutter button */
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              disabled={!isCameraReady}
              activeOpacity={0.75}
            >
              <View style={styles.captureInnerCircle} />
            </TouchableOpacity>
          ) : (
            /* Submit button */
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Scan</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Retake all (only when photos exist) */}
        {photos.length > 0 && !isSubmitting && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Retake All</Text>
          </TouchableOpacity>
        )}

      </View>

      {/* ══════════ SUCCESS MODAL ══════════ */}
      <Modal
        visible={successVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDone}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            <View style={styles.successRing}>
              <Ionicons name="checkmark-done" size={48} color={colors.primaryGreen} />
            </View>

            <Text style={styles.modalTitle}>Scan Submitted!</Text>
            <Text style={styles.modalMessage}>
              3 classroom photos have been queued for AI attendance processing.
            </Text>

            {/* Tiny photo previews */}
            <View style={styles.modalPhotoRow}>
              {photos.map((p, i) => (
                <Image key={i} source={{ uri: p.uri }} style={styles.modalThumb} />
              ))}
            </View>

            <View style={styles.modalInfoRow}>
              <Ionicons name="people-outline" size={15} color={colors.textGrey} />
              <Text style={styles.modalInfoText}>AI will process attendance shortly</Text>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={handleDone}>
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  // ── Root ─────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  // ── Permission ────────────────────────────────────────────────
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permTitle: {
    color: colors.textWhite,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 12,
  },
  permSub: {
    color: colors.textGrey,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  permButton: {
    backgroundColor: colors.primaryPeach,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 24,
  },
  permButtonText: {
    color: colors.darkOverlay,
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Header (absolute, mirrors FaceEnrollmentModal) ────────────
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.42)',
    zIndex: 10,
  },
  headerTitle: {
    color: colors.textWhite,
    fontSize: typography.h4,
    fontWeight: '800',
  },
  headerButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Camera overlay wrapper (vertically centred in the live feed area) ────
  overlayInstructions: {
    position: 'absolute',
    // sit in the middle of the camera area (above the bottom sheet)
    top: 0,
    left: 0,
    right: 0,
    bottom: '42%',        // keep clear of the bottom sheet
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    zIndex: 5,
  },
  subjectBadge: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  subjectBadgeText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '600',
  },
  instructionPill: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  instructionPillText: {
    color: colors.textWhite,
    fontSize: typography.body1,
    fontWeight: '700',
    overflow: 'hidden',
  },

  // ── Bottom control sheet (mirrors FaceEnrollmentModal's controlSection) ──
  controlSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.60)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 35,
    zIndex: 10,
  },
  instructionText: {
    color: colors.textWhite,
    fontSize: typography.body1,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },

  // ── Slots (identical to FaceEnrollmentModal) ──────────────────
  slotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 30,
  },
  slot: {
    width: 90,
    height: 90,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    position: 'relative',
    overflow: 'hidden',
  },
  slotImage: {
    width: '100%',
    height: '100%',
    borderRadius: 13,
  },
  slotLabel: {
    color: colors.textGrey,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#000000',
    borderRadius: 10,
  },

  // ── Actions container (identical to FaceEnrollmentModal) ──────
  actionsContainer: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  // Shutter button (identical to FaceEnrollmentModal captureButton)
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInnerCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.textWhite,
  },
  // Submit button (identical to FaceEnrollmentModal submitButton)
  submitButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '90%',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#000000',
    fontSize: typography.body1,
    fontWeight: '800',
  },
  // Retake (identical to FaceEnrollmentModal clearButton)
  clearButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  clearButtonText: {
    color: colors.primaryPeach,
    fontWeight: '600',
    fontSize: typography.body2,
  },

  // ── Success Modal ─────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#151517',
    borderRadius: 32,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  successRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(163,230,178,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(163,230,178,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textWhite,
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 15,
    color: colors.textGrey,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalPhotoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  modalThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(163,230,178,0.3)',
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  modalInfoText: {
    color: colors.textGrey,
    fontSize: 13,
    fontWeight: '500',
  },
  modalButton: {
    backgroundColor: colors.primaryPeach,
    paddingVertical: 16,
    borderRadius: 28,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.darkOverlay,
    fontSize: 17,
    fontWeight: '800',
  },
});
