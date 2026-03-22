// Navigation type definitions
export type RootStackParamList = {
  Onboarding: undefined;
  Landing: undefined;
  Home: undefined;
  Login: undefined;
  SignUp: undefined;
  OTPVerification: { email: string };
  ForgotPassword: undefined;
  Main: undefined;
  Chat: undefined;
  ImageGen: undefined;
  History: undefined;
  Credits: undefined;
  Profile: undefined;
  Settings: undefined;
  Help: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  About: undefined;
  SubscriptionPlans: undefined;
  Notifications: undefined;
  TextToVideo: undefined;
  ImageToVideo: undefined;
  TextToSpeech: undefined;
  VideoEffects: undefined;
  ImageEditor: undefined;
  ImageTo3D: undefined;
  InvoiceHistory: undefined;
  AdRewards: undefined;
};

// Extend React Navigation types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
