import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, LayoutAnimation, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

export default function StudentLoginPage({ navigation, route }) {
  const { login, isLoading } = useAuth();
  const role = route?.params?.role || 'Student';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      setError('');

      // Debug: Log current email and password values
      console.log('handleLogin called - email:', email, 'password:', password, 'role:', role);

      // Validate inputs
      if (!email || !email.trim()) {
        console.log('Email validation failed - empty email');
        setError('Please enter your college email');
        return;
      }
      if (!password || !password.trim()) {
        console.log('Password validation failed - empty password');
        setError('Please enter your password');
        return;
      }

      console.log('Validation passed, calling login...');

      // Call login from useAuth
      const result = await login(email, password);

      console.log('Login result:', result);

      if (result.success) {
        // Navigation will be handled automatically by App.js RootNavigator
        console.log('Login successful, navigating to dashboard');
      } else {
        console.log('Login failed:', result.error);
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login exception:', err);
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
            Your{'\n'}campus, in{'\n'}your pocket.
          </Text>

          <View style={styles.inputContainer}>
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={colors.primaryPeach} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="College Gmail ID"
                placeholderTextColor={colors.textGrey}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputWrapper, { borderColor: colors.primaryPeach }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.primaryPeach} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textGrey}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textGrey} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.bottomCard}>
            <Text style={styles.cardTitle}>Ready to{'\n'}start?</Text>
            
            <TouchableOpacity 
              style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.darkOverlay} size="small" />
              ) : (
                <>
                  <Text style={styles.actionButtonText}>Submit</Text>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="arrow-forward" size={18} color={colors.darkOverlay} />
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
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
    fontSize: 44,
    fontWeight: '800',
    color: colors.textWhite,
    lineHeight: 48,
    marginBottom: 40,
  },
  inputContainer: {
    gap: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: typography.body2,
    fontWeight: '600',
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4d4b38', // subtle yellow border
    borderRadius: 30,
    height: 60,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: colors.textWhite,
    fontSize: typography.body1,
  },
  eyeIcon: {
    padding: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    color: colors.primaryGreen,
    fontSize: typography.body2,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  bottomCard: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 32,
    padding: 24,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.darkOverlay,
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: colors.darkOverlay,
    borderRadius: 30,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: colors.textWhite,
    fontSize: typography.body2,
    fontWeight: 'bold',
    marginRight: 'auto',
    marginLeft: 20,
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
