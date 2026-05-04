import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';

export default function LibraryQRScanner({
  visible,
  onClose,
  onQRScanned,
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const cameraRef = useRef(null);
  const lastScannedRef = useRef(null);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission]);


  const handleBarcodeScanned = ({ data }) => {
    // Prevent multiple rapid scans of the same code
    if (lastScannedRef.current === data) {
      return;
    }

    lastScannedRef.current = data;
    // setIsScanning(false); // TEMPORARILY DISABLED TO ENSURE PROP UPDATES

    // Log the scanned QR secret
    console.log('--- QR SCAN START ---');
    console.log('Raw Scanned Data:', data);
    console.log('Type of Data:', typeof data);
    console.log('--- QR SCAN END ---');

    try {
      onQRScanned(data);
    } catch (error) {
      console.error('QR Scan Error:', error);
      Alert.alert('Error', 'Failed to process QR code');
      handleRescan();
    }
  };

  const handleRescan = () => {
    lastScannedRef.current = null;
    setIsScanning(true);
  };

  const handleClose = () => {
    handleRescan();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.scannerContainer}>
        {/* Camera Component */}
        {visible && (
          <CameraView
            key="library-qr-camera"
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            enableTorch={isTorchOn}
            onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          />
        )}

        {/* Overlay Content - Absolute Positioned */}
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleClose}
          >
            <Ionicons name="close" size={28} color={colors.textWhite} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Library QR</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsTorchOn(!isTorchOn)}
          >
            <Ionicons
              name={isTorchOn ? 'flashlight' : 'flashlight-outline'}
              size={28}
              color={isTorchOn ? colors.primaryPeach : colors.textWhite}
            />
          </TouchableOpacity>
        </View>

        {/* Scanning Frame */}
        <View style={styles.scannerContent}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Scanning Line Animation */}
            {isScanning && (
              <View style={styles.scanningLineContainer}>
                <View style={styles.scanningLine} />
              </View>
            )}
          </View>

          <Text style={styles.instructionText}>
            {isScanning
              ? 'Position QR code within the frame'
              : 'Processing QR code...'}
          </Text>
        </View>

        {/* Bottom Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>📱 Library Check-in/out</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textWhite,
    fontSize: typography.body1,
    marginTop: 15,
  },
  permissionCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: colors.background,
  },
  permissionIcon: {
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
    color: colors.textWhite,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: typography.body2,
    color: colors.textGrey,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: colors.darkOverlay,
    fontWeight: '700',
    fontSize: typography.body1,
  },
  cancelPermissionButton: {
    backgroundColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  cancelPermissionButtonText: {
    color: colors.textWhite,
    fontWeight: '700',
    fontSize: typography.body1,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: colors.darkOverlay,
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
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    color: colors.textWhite,
    fontSize: typography.h4,
    fontWeight: '800',
  },
  scannerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 80,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 5,
  },
  scanFrame: {
    width: 280,
    height: 280,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    backgroundColor: 'rgba(163, 230, 178, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderColor: colors.primaryPeach,
    borderWidth: 3,
  },
  topLeft: {
    top: -3,
    left: -3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -3,
    right: -3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -3,
    left: -3,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -3,
    right: -3,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanningLineContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  scanningLine: {
    width: '90%',
    height: 3,
    backgroundColor: colors.primaryGreen,
    borderRadius: 2,
  },
  instructionText: {
    color: colors.textWhite,
    fontSize: typography.body2,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 25,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    zIndex: 10,
  },
  footerText: {
    color: colors.textGrey,
    fontSize: typography.caption,
  },
});
