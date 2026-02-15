// Navigation type definitions
export type RootStackParamList = {
  Landing: undefined;
  Home: undefined;
  Chat: undefined;
  ImageGen: undefined;
  History: undefined;
  Credits: undefined;
  Profile: undefined;
};

// Extend React Navigation types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
