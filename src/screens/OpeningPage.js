import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, Animated, PanResponder } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography } from "../theme";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

export default function OpeningPage({ navigation }) {
  const { isSignedIn, userRole } = React.useContext(AuthContext);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const loadingDots = useRef(new Animated.Value(0)).current;
  const exitFade = useRef(new Animated.Value(1)).current;
  
  const pan = useRef(new Animated.ValueXY()).current;
  const buttonWidth = useRef(0);
  const THUMB_WIDTH = 66;
  const PADDING = 6;

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Loop for loading dots if user is signed in
    if (isSignedIn) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingDots, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(loadingDots, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();

      // Start dissolving/exit animation
      Animated.timing(exitFade, {
        toValue: 0,
        duration: 1500, // Slow dissolve
        useNativeDriver: true,
      }).start();
      
      // No need to navigate - RootNavigator will automatically switch to dashboard
      // based on the dynamic initialRouteName
      return;
    }
  }, [isSignedIn, userRole]);

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-45deg", "0deg"]
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isSignedIn,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: 0 });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (e, gesture) => {
        const maxSwipe = buttonWidth.current - THUMB_WIDTH - (PADDING * 2);
        if (gesture.dx > 0 && gesture.dx <= maxSwipe) {
          pan.setValue({ x: gesture.dx, y: 0 });
        }
      },
      onPanResponderRelease: (e, gesture) => {
        pan.flattenOffset();
        const maxSwipe = buttonWidth.current - THUMB_WIDTH - (PADDING * 2);
        if (gesture.dx > maxSwipe * 0.7) {
          Animated.timing(pan, {
            toValue: { x: maxSwipe, y: 0 },
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            navigation.navigate("Intro");
            setTimeout(() => {
              pan.setValue({ x: 0, y: 0 });
            }, 400);
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      }
    })
  ).current;

  return (
    <SafeAreaView style={styles.container}>

      <Animated.View style={[styles.content, { opacity: exitFade, transform: [{ scale: exitFade.interpolate({ inputRange: [0, 1], outputRange: [1.1, 1] }) }] }]}>
        
        <View style={styles.gridOverlay}>
          {[...Array(8)].map((_, i) => (
            <View key={i} style={styles.gridRow}>
              {[...Array(6)].map((_, j) => (
                <View key={j} style={styles.gridDot} />
              ))}
            </View>
          ))}
        </View>

        <Animated.View 
          style={[
            styles.logoContainer,
            { 
              transform: [
                { scale: logoScale },
                { rotate: spin }
              ]
            }
          ]}
        >
          <View style={styles.logoBackground}>
            <Ionicons name="shield" size={80} color={colors.primaryPeach} />
          </View>
        </Animated.View>

        <Animated.View style={{ 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          alignItems: "center" 
        }}>
          <Text style={styles.title}>AUTHORITY</Text>
          <View style={styles.subtitleContainer}>
            <View style={styles.line} />
            <Text style={styles.subtitle}>CAMPUS MANAGEMENT</Text>
            <View style={styles.line} />
          </View>
        </Animated.View>

        {isSignedIn && (
          <Animated.View style={[styles.loadingContainer, { opacity: textOpacity }]}>
            <View style={styles.dotsRow}>
              <Animated.View style={[styles.dot, { opacity: loadingDots }]} />
              <View style={[styles.dot, { backgroundColor: colors.primaryPeach, opacity: 0.8 }]} />
              <View style={[styles.dot, { opacity: 0.3 }]} />
            </View>
            <Text style={styles.loadingText}>SYSTEM INITIALIZING</Text>
          </Animated.View>
        )}
      </Animated.View>

      <Animated.View style={[styles.bottomSection, { opacity: exitFade }]}>
        {!isSignedIn ? (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], width: "100%", alignItems: "center" }}>
            <View style={styles.buttonBorder}>
              <View 
                style={styles.button}
                onLayout={(e) => { buttonWidth.current = e.nativeEvent.layout.width; }}
              >
                <Text style={styles.buttonText}>Swipe to Dive In</Text>
                <Animated.View 
                  style={[styles.arrowCircle, { transform: [{ translateX: pan.x }] }]}
                  {...panResponder.panHandlers}
                >
                  <Ionicons name="arrow-forward" size={32} color={colors.darkOverlay} />
                </Animated.View>
              </View>
            </View>
            <Text style={styles.versionLabel}>V1.0 • RV UNIVERSITY</Text>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.statusBadge, { opacity: textOpacity }]}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>VERIFIED ACADEMIC NODE</Text>
          </Animated.View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-around",
    padding: 30,
    opacity: 0.05,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  gridDot: {
    width: 2,
    height: 2,
    backgroundColor: colors.textWhite,
    borderRadius: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    marginBottom: 40,
    shadowColor: colors.primaryPeach,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  logoBackground: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    width: 170,
    height: 170,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: colors.textWhite,
    letterSpacing: 3,
    textAlign: "center",
  },
  subtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textGrey,
    fontWeight: "600",
    letterSpacing: 4,
    marginHorizontal: 15,
  },
  line: {
    height: 1,
    width: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  loadingContainer: {
    marginTop: 60,
    alignItems: "center",
  },
  dotsRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textWhite,
    marginHorizontal: 4,
  },
  loadingText: {
    color: colors.textGrey,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    width: "100%",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 174, 136, 0.05)",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 174, 136, 0.15)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryPeach,
    marginRight: 12,
  },
  statusText: {
    color: colors.primaryPeach,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  buttonBorder: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 70,
    padding: 6,
    marginBottom: 28,
    width: "100%",
  },
  button: {
    backgroundColor: colors.darkOverlay,
    borderRadius: 60,
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: "100%",
  },
  buttonText: {
    color: colors.textWhite,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
    paddingLeft: 30,
  },
  arrowCircle: {
    position: "absolute",
    left: 6,
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.textWhite,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  versionLabel: {
    color: colors.textGrey,
    fontSize: 10,
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 1.5,
    opacity: 0.6,
  }
});

