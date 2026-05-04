import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, StatusBar } from 'react-native';
import { colors } from './src/theme';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { DataCacheProvider } from './src/context/DataCacheContext';

import OpeningPage from './src/screens/OpeningPage';
import IntroPage from './src/screens/IntroPage';
import LoginSelectionPage from './src/screens/LoginSelectionPage';
import StudentLoginPage from './src/screens/StudentLoginPage';
import TeacherLoginPage from './src/screens/TeacherLoginPage';
import StudentFaceEnrollmentPage from './src/screens/StudentFaceEnrollmentPage';
import StudentDashboardPage from './src/screens/StudentDashboardPage';
import TeacherDashboardPage from './src/screens/TeacherDashboardPage';
import TeacherSchedulePage from './src/screens/TeacherSchedulePage';
import ClassroomScanPage from './src/screens/ClassroomScanPage';
import TeacherSubjectStudentsListPage from './src/screens/TeacherSubjectStudentsListPage';
import TeacherSubjectStudentAttendancePage from './src/screens/TeacherSubjectStudentAttendancePage';
import TeacherProfilePage from './src/screens/TeacherProfilePage';
import StudentProfilePage from './src/screens/StudentProfilePage';
import TeacherAiAssistant from './src/screens/TeacherAiAssistant';
import TeacherAnalyticsDashboardPage from './src/screens/TeacherAnalyticsDashboardPage';
import StudentAnalyticsDashboard from './src/screens/StudentAnalyticsDashboard';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const PlaceholderScreen = () => <></>;

function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 0,
          elevation: 0,
          height: 80,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: colors.primaryGreen,
        tabBarInactiveTintColor: colors.textGrey,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'apps' : 'apps-outline';
          else if (route.name === 'Schedule') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'AI') iconName = focused ? 'sparkles' : 'sparkles-outline';
          else if (route.name === 'Analytics') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={StudentDashboardPage} />
      <Tab.Screen name="Schedule" component={PlaceholderScreen} />
      <Tab.Screen name="AI" component={TeacherAiAssistant} />
      <Tab.Screen name="Analytics" component={StudentAnalyticsDashboard} />
    </Tab.Navigator>
  );
}

function TeacherTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 0,
          elevation: 0,
          height: 80,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: colors.primaryGreen,
        tabBarInactiveTintColor: colors.textGrey,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'apps' : 'apps-outline';
          else if (route.name === 'Schedule') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'AI') iconName = focused ? 'sparkles' : 'sparkles-outline';
          else if (route.name === 'Analytics') iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={TeacherDashboardPage} />
      <Tab.Screen name="Schedule" component={TeacherSchedulePage} />
      <Tab.Screen name="AI" component={TeacherAiAssistant} />
      <Tab.Screen name="Analytics" component={TeacherAnalyticsDashboardPage} />
    </Tab.Navigator>
  );
}

/**
 * Root Navigation - Routes based on authentication status and user role
 */
function RootNavigator() {
  const context = React.useContext(AuthContext);

  if (!context) {
    return <></>;
  }

  const { isLoading, isSignedIn, userRole } = context;

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
      </View>
    );
  }

  // Determine initial route based on auth status
  const initialRouteName = isSignedIn 
    ? (userRole?.toUpperCase() === 'STUDENT' ? 'StudentDashboardTabs' : 'TeacherDashboardTabs')
    : 'Opening';

  return (
    <Stack.Navigator 
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
        animationDuration: 1500,
      }}
    >
      {/* Auth Stack - Always available for navigation back to login */}
      <Stack.Screen name="Opening" component={OpeningPage} />
      <Stack.Screen name="Intro" component={IntroPage} />
      <Stack.Screen name="LoginSelection" component={LoginSelectionPage} />
      <Stack.Screen name="StudentLogin" component={StudentLoginPage} />
      <Stack.Screen name="TeacherLogin" component={TeacherLoginPage} />
      <Stack.Screen name="StudentFaceEnrollment" component={StudentFaceEnrollmentPage} />

      {/* App Stack - Shown when user IS logged in */}
      {isSignedIn && (
        <>
          {userRole?.toUpperCase() === 'STUDENT' ? (
            <>
              <Stack.Screen name="StudentDashboardTabs" component={StudentTabs} />
              <Stack.Screen name="ClassroomScan" component={ClassroomScanPage} />
              <Stack.Screen name="StudentProfilePage" component={StudentProfilePage} options={{ animation: 'slide_from_bottom' }} />
            </>
          ) : (
            <>
              <Stack.Screen name="TeacherDashboardTabs" component={TeacherTabs} />
              <Stack.Screen name="ClassroomScan" component={ClassroomScanPage} />
              <Stack.Screen name="TeacherSubjectStudentsListPage" component={TeacherSubjectStudentsListPage} />
              <Stack.Screen name="TeacherSubjectStudentAttendancePage" component={TeacherSubjectStudentAttendancePage} />
              <Stack.Screen name="TeacherProfilePage" component={TeacherProfilePage} options={{ animation: 'slide_from_bottom' }} />
            </>
          )}
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataCacheProvider>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </DataCacheProvider>
    </AuthProvider>
  );
}
