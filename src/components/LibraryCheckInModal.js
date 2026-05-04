import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import { Library_API_ROUTES } from '../lib/constants';
import { getAccessToken } from '../utils/tokenStorage';

export default function LibraryCheckInModal({
  visible,
  onClose,
  qrSecret,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState('ENTRY'); // 'ENTRY' or 'EXIT'
  const [actualSecret, setActualSecret] = useState('');
  const [slideAnimation] = useState(new Animated.Value(400));

  // Parse QR data and set action/secret
  useEffect(() => {
    if (visible && qrSecret) {
      console.log('[LibraryModal] useEffect triggered with:', qrSecret);
      
      try {
        let parsed;
        if (typeof qrSecret === 'string') {
          const trimmed = qrSecret.trim();
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            parsed = JSON.parse(trimmed);
            console.log('[LibraryModal] JSON Parse Success:', parsed);
          } else {
            console.log('[LibraryModal] Not a JSON string, using as raw secret');
            parsed = { secret: qrSecret, action: 'ENTRY' };
          }
        } else {
          parsed = qrSecret;
        }

        if (parsed && parsed.action) {
          const newAction = parsed.action.toUpperCase();
          console.log('[LibraryModal] Updating Action State to:', newAction);
          setAction(newAction);
        } else {
          // Default to ENTRY if no action is found in JSON or if it's a raw string
          setAction('ENTRY');
        }
        
        const finalSecret = parsed.secret || (typeof qrSecret === 'string' ? qrSecret : '');
        setActualSecret(finalSecret);
        
      } catch (e) {
        console.error('[LibraryModal] Parse Error:', e);
        setActualSecret(typeof qrSecret === 'string' ? qrSecret : '');
        setAction('ENTRY');
      }
    }
  }, [visible, qrSecret]);

  // Slide in animation when modal appears
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnimation, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 8,
      }).start();
    } else {
      slideAnimation.setValue(400);
    }
  }, [visible, slideAnimation]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log(`[LibraryAPI] Initiating ${action} request for secret: ${actualSecret}`);
    
    try {
      const userToken = getAccessToken();
      if (!userToken) {
        throw new Error('User token not found. Please log in again.');
      }

      const payload = {
        action,
        secret: actualSecret,
      };

      console.log('[LibraryAPI] Request Metadata:', {
        url: Library_API_ROUTES.LIBRARY_VISIT,
        method: 'POST',
        payload
      });

      const response = await fetch(Library_API_ROUTES.LIBRARY_VISIT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('[LibraryAPI] Server Response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Library visit failed.');
      }

      if (result.success) {
        Alert.alert(
          'Success!',
          `${result.message}\n\nLog ID: ${result.logId}\nState: ${result.state}`,
          [{ text: 'Continue', onPress: onClose }]
        );
      } else {
        throw new Error(result.message || 'Something went wrong.');
      }

    } catch (error) {
      console.error('[LibraryAPI] Submission Error:', error);
      Alert.alert('Visit Error', error.message || 'There was an issue processing your library visit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    Animated.timing(slideAnimation, {
      toValue: 400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const toggleAction = () => {
    setAction(prev => prev === 'ENTRY' ? 'EXIT' : 'ENTRY');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateX: slideAnimation }],
            },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            disabled={isSubmitting}
          >
            <Ionicons name="close" size={28} color={colors.textWhite} />
          </TouchableOpacity>

          {/* Welcome Icon & Message */}
          <View style={styles.welcomeSection}>
            <View style={styles.iconBackground}>
              <Ionicons
                name="library-outline"
                size={60}
                color={colors.primaryGreen}
              />
            </View>
            <Text style={styles.welcomeTitle}>
              {action === 'ENTRY' ? 'Welcome to the Library' : 'Thank you for visiting'}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              {action === 'ENTRY' 
                ? 'Your access is verified. Ready to check in?' 
                : 'We hope you had a productive session. Ready to check out?'}
            </Text>
          </View>

          {/* QR Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Ionicons 
                  name={action === 'ENTRY' ? "log-in" : "log-out"} 
                  size={20} 
                  color={action === 'ENTRY' ? colors.primaryGreen : colors.primaryPeach} 
                />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Action Type</Text>
                <Text style={styles.detailValue}>Library {action === 'ENTRY' ? 'Entry' : 'Exit'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Ionicons name="time-outline" size={20} color={colors.primaryPeach} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{action === 'ENTRY' ? 'Entry Time' : 'Exit Time'}</Text>
                <Text style={styles.detailValue}>
                  {new Date().toLocaleTimeString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
              action === 'EXIT' && { backgroundColor: colors.primaryPeach }
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator
                  size="small"
                  color={colors.darkOverlay}
                  style={styles.buttonLoader}
                />
                <Text style={styles.submitButtonText}>Processing...</Text>
              </>
            ) : (
              <>
                <Ionicons name={action === 'ENTRY' ? "log-in-outline" : "log-out-outline"} size={20} color={colors.darkOverlay} />
                <Text style={styles.submitButtonText}>{action === 'ENTRY' ? 'Confirm Entry' : 'Confirm Exit'}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Info Footer */}
          <View style={styles.infoFooter}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textGrey} />
            <Text style={styles.infoText}>
              Your {action.toLowerCase()} request will be processed immediately
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 10,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(163, 230, 178, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(163, 230, 178, 0.3)',
  },
  welcomeTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
    color: colors.textWhite,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: typography.body2,
    color: colors.textGrey,
    textAlign: 'center',
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(163, 230, 178, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.caption,
    color: colors.textGrey,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: typography.body2,
    fontWeight: '600',
    color: colors.textWhite,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  submitButton: {
    backgroundColor: colors.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 15,
    gap: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.darkOverlay,
    fontSize: typography.body1,
    fontWeight: '800',
  },
  buttonLoader: {
    marginRight: 5,
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 174, 136, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 174, 136, 0.15)',
    gap: 10,
  },
  infoText: {
    fontSize: typography.caption,
    color: colors.textGrey,
    flex: 1,
  },
  actionToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 25,
    padding: 4,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 21,
    gap: 8,
  },
  actionButtonActive: {
    backgroundColor: colors.primaryGreen,
  },
  actionButtonText: {
    fontSize: typography.body2,
    fontWeight: '600',
    color: colors.textWhite,
  },
  actionButtonTextActive: {
    color: colors.darkOverlay,
  },
});
