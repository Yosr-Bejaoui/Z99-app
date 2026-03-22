import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { creditsService, STORAGE_KEYS } from '../services';
import { useAuth } from './AuthContext';

export interface CreditAccount {
  credits: number;
  bonus_credits?: number;
  total_credits?: number;
  usedWords?: number;
  isPro?: boolean;
}

interface CreditsContextType {
  credits: CreditAccount | null;
  isLoading: boolean;
  isRefreshing: boolean;
  fetchCredits: () => Promise<void>;
  refreshCredits: () => Promise<void>;
  deductCredits: (amount: number, description: string) => Promise<boolean>;
  addCredits: (amount: number, description: string) => Promise<void>;
  hasEnoughCredits: (amount: number) => boolean;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [credits, setCredits] = useState<CreditAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const appState = useRef(AppState.currentState);

  const fetchCredits = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        setCredits(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const data = await creditsService.getCreditBalance();
      setCredits(data);
    } catch (error) {
      console.error('Error fetching credits:', error);
      setCredits(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshCredits = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        return;
      }

      setIsRefreshing(true);
      const data = await creditsService.getCreditBalance();
      setCredits(data);
    } catch (error) {
      console.error('Error refreshing credits:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Keep credits synced with login/logout state changes.
  useEffect(() => {
    if (isAuthenticated) {
      refreshCredits();
    } else {
      setCredits(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshCredits]);

  // Refresh credits when app returns to foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        refreshCredits();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [refreshCredits]);

  const hasEnoughCredits = useCallback(
    (amount: number): boolean => {
      if (!credits) return false;
      return credits.credits >= amount;
    },
    [credits]
  );

  const deductCredits = useCallback(
    async (amount: number, description: string): Promise<boolean> => {
      if (!hasEnoughCredits(amount)) {
        return false;
      }

      try {
        setCredits((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            credits: Math.max(0, prev.credits - amount),
            total_credits: Math.max(0, (prev.total_credits || prev.credits) - amount),
          };
        });

        await refreshCredits();
        return true;
      } catch (error) {
        console.error('Error deducting credits:', error);
        await fetchCredits();
        return false;
      }
    },
    [hasEnoughCredits, refreshCredits, fetchCredits]
  );

  const addCredits = useCallback(async (amount: number, description: string) => {
    try {
      setCredits((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          credits: prev.credits + amount,
          total_credits: (prev.total_credits || prev.credits) + amount,
        };
      });

      await refreshCredits();
    } catch (error) {
      console.error('Error adding credits:', error);
      await fetchCredits();
    }
  }, [refreshCredits, fetchCredits]);

  return (
    <CreditsContext.Provider
      value={{
        credits,
        isLoading,
        isRefreshing,
        fetchCredits,
        refreshCredits,
        deductCredits,
        addCredits,
        hasEnoughCredits,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}
