import React, { createContext, useContext } from 'react';

export interface NavigationParams {
  sessionId?: number;
  [key: string]: any;
}

interface DrawerContextType {
  openDrawer: () => void;
  closeDrawer: () => void;
  isOpen: boolean;
  navigateTo: (route: string, params?: NavigationParams) => void;
  currentParams: NavigationParams | null;
}

export const DrawerContext = createContext<DrawerContextType>({
  openDrawer: () => {},
  closeDrawer: () => {},
  isOpen: false,
  navigateTo: () => {},
  currentParams: null,
});

export const useDrawer = () => useContext(DrawerContext);
