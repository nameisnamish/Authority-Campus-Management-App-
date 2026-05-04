import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { colors, typography } from '../theme';
import { FaceEnrollment_API_ROUTES } from '../lib/constants';
import { getAccessToken } from '../utils/tokenStorage';

export default function FaceEnrollmentModal({ visible, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState([]); // Array to store { uri, angle }
  const [isUploading, setIsUploading] = useState(false);
  const [isModalReady, setIsModalReady] = useState(false); // To prevent SurfaceView black screens on Android during animation
  const cameraRef = useRef(null);

  const angles = ['front', 'left', 'right'];
  const currentAngleIndex = photos.length;
  const currentAngle = angles[currentAngleIndex];

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
    if (!visible) {
      setIsModalReady(false);
    }
  }, [visible, permission]);

  useEffect(() => {
    console.log('FaceEnrollmentModal - Visible:', visible);
    console.log('FaceEnrollmentModal - Permission Granted:', permission?.granted);
    console.log('FaceEnrollmentModal - Permission Status:', permission?.status);
  }, [visible, permission]);

  const takePicture = async () => {
    if (cameraRef.current && photos.length < 3) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: false, // We will manually convert to b64 later to ensure consistency
        });
        if (photo.uri) {
          setPhotos((prev) => [...prev, { uri: photo.uri, angle: currentAngle }]);
        }
      } catch (error) {
        console.error('Failed to take picture:', error);
        Alert.alert('Capture Error', 'Could not capture the image. Try again.');
      }
    }
  };

  const handleClear = () => {
    setPhotos([]);
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  const submitFaceData = async () => {
    if (photos.length !== 3) return;

    setIsUploading(true);

    try {
      const userToken = getAccessToken();
      if (!userToken) {
        throw new Error('User token not found. Please log in again.');
      }

      // Prepare face_samples with base64 images
      const face_samples = await Promise.all(
        photos.map(async (photo) => {
          const base64 = await FileSystem.readAsStringAsync(photo.uri, {
            encoding: 'base64',
          });
          return {
            angle: photo.angle,
            image_b64: `data:image/jpeg;base64,${base64}`,
          };
        })
      );

      const response = await fetch(FaceEnrollment_API_ROUTES.ENROLL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ face_samples }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Face enrollment failed.');
      }

      if (result.success) {
        Alert.alert(
          'Success!',
          `${result.message}\n\nProcessed: ${result.records_created} angles: ${result.angles.join(', ')}`,
          [{ text: 'Continue', onPress: handleClose }]
        );
      } else {
        throw new Error(result.message || 'Something went wrong.');
      }

    } catch (error) {
      console.error('Submission Error:', error);
      Alert.alert('Enrollment Error', error.message || 'There was an issue submitting your face data.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={handleClose}
      onShow={() => setIsModalReady(true)}
    >
      <View style={styles.container}>
        
        {/* Camera Component acting as full background */}
        {visible && permission?.granted && isModalReady && (
          <CameraView
            key="face-enrollment-camera"
            ref={cameraRef}
            style={styles.camera}
            facing="front"
          />
        )}

        {/* Overlay Content - Absolute Positioned */}
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color={colors.textWhite} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Face Enrollment</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Top Overlay Instructions */}
        <View style={styles.overlayInstructions}>
          <Text style={styles.overlayText}>
            {photos.length < 3 ? `Capture: ${currentAngle.toUpperCase()} view` : 'All captures done!'}
          </Text>
        </View>

        {/* BOTTOM SECTION: Controls UI */}
        <View style={styles.controlSection}>
          <Text style={styles.instructionText}>
            {photos.length < 3 
              ? `Please look ${currentAngle} for the camera` 
              : 'Review your photos and submit'}
          </Text>

          {/* Slots UI */}
          <View style={styles.slotsContainer}>
            {angles.map((angle, index) => {
              const photo = photos[index];
              const isActive = index === photos.length;
              return (
                <View key={angle} style={[
                  styles.slot, 
                  isActive && { borderColor: colors.primaryPeach, borderStyle: 'solid' }
                ]}>
                  {photo ? (
                    <Image source={{ uri: photo.uri }} style={styles.slotImage} />
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <Ionicons 
                        name={angle === 'front' ? 'person' : angle === 'left' ? 'return-down-back' : 'return-down-forward'} 
                        size={24} 
                        color={isActive ? colors.primaryPeach : colors.textGrey} 
                      />
                      <Text style={[styles.slotLabel, isActive && { color: colors.primaryPeach }]}>{angle}</Text>
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

          {/* Action Buttons Row */}
          <View style={styles.actionsContainer}>
            {photos.length < 3 ? (
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
                disabled={isUploading}
              >
                <View style={styles.captureInnerCircle} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitFaceData}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Enrollment</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Reset functionality */}
          {photos.length > 0 && !isUploading && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
               <Text style={styles.clearButtonText}>Retake All</Text>
            </TouchableOpacity>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 45, // Adjusted for notch
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
  overlayInstructions: {
    position: 'absolute',
    top: 120, 
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
    zIndex: 5,
  },
  overlayText: {
    color: colors.textWhite,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: typography.body1,
    fontWeight: '700',
    overflow: 'hidden',
  },
  controlSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
  },
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
  actionsContainer: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
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
});
