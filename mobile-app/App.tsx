import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './src/theme';
import { AuthProvider, useAuth } from './src/context';

// Screens
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HelpScreen from './src/screens/HelpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import SubscriptionPlansScreen from './src/screens/SubscriptionPlansScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';

// AI Feature Screens
import TextToVideoScreen from './src/screens/TextToVideoScreen';
import ImageToVideoScreen from './src/screens/ImageToVideoScreen';
import TextToSpeechScreen from './src/screens/TextToSpeechScreen';
import VideoEffectsScreen from './src/screens/VideoEffectsScreen';
import ImageEditorScreen from './src/screens/ImageEditorScreen';
import ImageTo3DScreen from './src/screens/ImageTo3DScreen';
import InvoiceHistoryScreen from './src/screens/InvoiceHistoryScreen';
import AdRewardsScreen from './src/screens/AdRewardsScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Landing: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  Settings: undefined;
  Help: undefined;
  SubscriptionPlans: undefined;
  Notifications: undefined;
  // AI Features
  TextToVideo: undefined;
  ImageToVideo: undefined;
  TextToSpeech: undefined;
  VideoEffects: undefined;
  ImageEditor: undefined;
  ImageTo3D: undefined;
  // Account
  InvoiceHistory: undefined;
  AdRewards: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function Navigation() {
  const { isLoading, isAuthenticated } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const seen = await AsyncStorage.getItem('hasSeenOnboarding');
      setHasSeenOnboarding(seen === 'true');
    } catch {
      setHasSeenOnboarding(true); // Default to true if error
    }
  };

  if (isLoading || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const getInitialRoute = () => {
    if (!hasSeenOnboarding) return "Onboarding";
    if (isAuthenticated) return "Main";
    return "Landing";
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
      initialRouteName={getInitialRoute()}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen 
        name="Main" 
        component={MainTabNavigator}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="SubscriptionPlans" 
        component={SubscriptionPlansScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      {/* AI Feature Screens */}
      <Stack.Screen 
        name="TextToVideo" 
        component={TextToVideoScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="ImageToVideo" 
        component={ImageToVideoScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="TextToSpeech" 
        component={TextToSpeechScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="VideoEffects" 
        component={VideoEffectsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="ImageEditor" 
        component={ImageEditorScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="ImageTo3D" 
        component={ImageTo3DScreen}
        options={{ animation: 'slide_from_right' }}
      />
      {/* Account Screens */}
      <Stack.Screen 
        name="InvoiceHistory" 
        component={InvoiceHistoryScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen 
        name="AdRewards" 
        component={AdRewardsScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary: colors.primary,
              background: colors.background,
              card: colors.card,
              text: colors.foreground,
              border: colors.border,
              notification: colors.primary,
            },
          }}
        >
          <Navigation />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
