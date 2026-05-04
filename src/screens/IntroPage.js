import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export default function IntroPage({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
          Master your{'\n'}
          <Text style={styles.highlightText}>campus{'\n'}experience</Text> with{'\n'}
          confidence.
        </Text>

        <View style={styles.featureItem}>
          <View style={[styles.iconBox, { backgroundColor: '#4A3D35' }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primaryPeach} />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Real Time Tracking</Text>
            <Text style={styles.featureDesc}>Monitor your attendance stats, check your "safe to miss" limits, and never fall behind on course requirements.</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.iconBox, { backgroundColor: '#2D3A31' }]}>
            <Ionicons name="sparkles" size={16} color={colors.primaryGreen} />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>AI-Powered Attendance</Text>
            <Text style={styles.featureDesc}>Secure, AI-powered facial recognition to log and verify classroom presence in seconds—no manual roll calls needed.</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.iconBox, { backgroundColor: '#2C2B38' }]}>
            <Ionicons name="people" size={16} color={'#A0A0FF'} />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Seamless Resolution</Text>
            <Text style={styles.featureDesc}>Streamline communication. Easily submit absence disputes with medical proof, or review and approve them with a single tap.</Text>
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonBorder}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('LoginSelection')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Create Account</Text>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
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
    fontSize: typography.h1,
    fontWeight: '800',
    color: colors.textWhite,
    lineHeight: 48,
    marginBottom: 40,
  },
  highlightText: {
    color: colors.primaryGreen,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    color: colors.textWhite,
    fontSize: typography.body1,
    fontWeight: '700',
    marginBottom: 6,
  },
  featureDesc: {
    color: colors.textGrey,
    fontSize: typography.body2,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  buttonBorder: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 40,
    padding: 10,
  },
  button: {
    backgroundColor: colors.darkOverlay,
    borderRadius: 30,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.textWhite,
    fontSize: typography.h4,
    fontWeight: 'bold',
    marginRight: 12,
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
