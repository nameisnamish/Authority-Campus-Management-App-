import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export default function LoginSelectionPage({ navigation }) {
  const [selectedRole, setSelectedRole] = useState('Student');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            navigation.canGoBack() && navigation.goBack();
          }}>
            <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
          </TouchableOpacity>
          <View style={styles.logoTitleContainer}>
            <View style={styles.miniLogo}>
              <Ionicons name="shield" size={16} color={colors.darkOverlay} />
            </View>
            <Text style={styles.headerText}>Authority</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.mainTitle}>
          Welcome to{'\n'}your{'\n'}campus.
        </Text>
        <Text style={styles.subtitle}>
          Access your digital{'\n'}dashboard securely.
        </Text>

        <View style={styles.roleContainer}>
          <TouchableOpacity 
            style={[styles.roleButton, selectedRole === 'Student' && styles.roleActive]}
            onPress={() => setSelectedRole('Student')}
          >
            <Ionicons name="school" size={20} color={selectedRole === 'Student' ? colors.darkOverlay : colors.textGrey} />
            <Text style={[styles.roleText, selectedRole === 'Student' && styles.roleTextActive]}> Student</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.roleButton, selectedRole === 'Teacher' && styles.roleActive]}
            onPress={() => setSelectedRole('Teacher')}
          >
            <Ionicons name="person" size={20} color={selectedRole === 'Teacher' ? colors.darkOverlay : colors.textGrey} />
            <Text style={[styles.roleText, selectedRole === 'Teacher' && styles.roleTextActive]}> Teacher</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.bottomCard}>
          <Text style={styles.cardTitle}>Secure{'\n'}Login</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
               if (selectedRole === 'Student') {
                 navigation.navigate('StudentLogin', { role: 'Student' });
               } else {
                 navigation.navigate('TeacherLogin', { role: 'Teacher' });
               }
            }}
          >
            <Text style={styles.actionButtonText}>Get Started</Text>
            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-forward" size={18} color={colors.darkOverlay} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 60,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    marginRight: 8,
  },
  logoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniLogo: {
    backgroundColor: colors.primaryPeach,
    padding: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  headerText: {
    color: colors.textWhite,
    fontWeight: 'bold',
    fontSize: typography.body1,
  },
  mainTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.textWhite,
    lineHeight: 52,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: typography.body1,
    color: colors.textGrey,
    marginBottom: 40,
    lineHeight: 24,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleActive: {
    backgroundColor: colors.primaryPeach,
    borderColor: colors.primaryPeach,
  },
  roleText: {
    color: colors.textGrey,
    fontSize: typography.body1,
    fontWeight: '600',
    marginLeft: 8,
  },
  roleTextActive: {
    color: colors.darkOverlay,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  bottomCard: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 32,
    padding: 24,
    paddingBottom: 24,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.darkOverlay,
    marginBottom: 40,
  },
  actionButton: {
    backgroundColor: colors.darkOverlay,
    borderRadius: 30,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  actionButtonText: {
    color: colors.textWhite,
    fontSize: typography.body1,
    fontWeight: 'bold',
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.textWhite,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
