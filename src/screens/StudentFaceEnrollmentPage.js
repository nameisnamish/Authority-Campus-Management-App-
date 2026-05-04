import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function StudentFaceEnrollmentPage({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          navigation.canGoBack() && navigation.goBack();
        }}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Face Enrollment</Text>
        <View style={{width: 40}} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoBadge}>
          <Text style={styles.infoText}>Let's set up{'\n'}your profile!</Text>
          <View style={styles.smileFace}>
            <Ionicons name="happy" size={48} color={colors.darkOverlay} />
            <View style={styles.cameraIconBadge}>
              <Ionicons name="camera" size={12} color={colors.darkOverlay} />
            </View>
          </View>
        </View>

        <View style={styles.cameraFramePreview}>
          <View style={styles.cameraTarget}>
            {/* Outline placeholder */}
            <View style={styles.targetOutline} />
            <View style={styles.headOutline} />
            <View style={styles.bodyOutline} />
          </View>
        </View>

        <View style={styles.stepBadge}>
          <Ionicons name="happy-outline" size={16} color={colors.primaryPeach} />
          <Text style={styles.stepText}>Step 1 of 3: Look straight</Text>
        </View>
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="flash" size={24} color={colors.textWhite} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureButton}>
          <Ionicons name="camera" size={32} color={colors.darkOverlay} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="camera-reverse" size={24} color={colors.textWhite} />
        </TouchableOpacity>
      </View>

      <View style={styles.submitContainer}>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={() => navigation.navigate('StudentDashboardTabs')}
        >
          <Text style={styles.submitButtonText}>Submit Image</Text>
        </TouchableOpacity>
      </View>
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
    padding: 8,
    marginLeft: -8,
    marginRight: 8,
  },
  headerTitle: {
    color: colors.textWhite,
    fontSize: typography.h4,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  infoBadge: {
    backgroundColor: colors.primaryPeach,
    width: '100%',
    borderRadius: 30,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  infoText: {
    color: colors.darkOverlay,
    fontSize: 24,
    fontWeight: '800',
  },
  smileFace: {
    position: 'relative',
  },
  cameraIconBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFE169',
    borderRadius: 8,
    padding: 4,
  },
  cameraFramePreview: {
    width: width - 48,
    height: width - 48,
    backgroundColor: colors.surface,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    overflow: 'hidden',
  },
  cameraTarget: {
    width: '70%',
    height: '80%',
    borderWidth: 2,
    borderColor: '#E6E27A',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headOutline: {
    width: 100,
    height: 100,
    backgroundColor: colors.textWhite,
    borderRadius: 50,
    marginBottom: 10,
  },
  bodyOutline: {
    width: 180,
    height: 100,
    backgroundColor: colors.textWhite,
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
    position: 'absolute',
    bottom: -10,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryPeach,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  stepText: {
    color: colors.primaryPeach,
    fontSize: typography.body2,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingBottom: 40,
    paddingHorizontal: 40,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitContainer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  submitButton: {
    backgroundColor: colors.primaryPeach,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  submitButtonText: {
    color: colors.darkOverlay,
    fontSize: 16,
    fontWeight: '700',
  }
});
