import { createContext } from 'react';

export interface OnboardingContextValue {
  showOnboarding: boolean;
  completeOnboarding: () => void;
  restartTutorial: () => void;
}

export const OnboardingContext = createContext<OnboardingContextValue>({
  showOnboarding: false,
  completeOnboarding: () => {},
  restartTutorial: () => {},
});
