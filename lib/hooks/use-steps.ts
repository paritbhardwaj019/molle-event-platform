import { useState, useCallback } from "react";

interface UseStepsProps {
  totalSteps: number;
  initialStep?: number;
}

interface UseStepsReturn {
  currentStep: number;
  steps: number[];
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number;
  goToStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  reset: () => void;
}

export function useSteps({
  totalSteps,
  initialStep = 1,
}: UseStepsProps): UseStepsReturn {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;
  const progress = (currentStep / totalSteps) * 100;

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= totalSteps) {
        setCurrentStep(step);
      }
    },
    [totalSteps]
  );

  const goToNextStep = useCallback(() => {
    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep]);

  const goToPreviousStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [isFirstStep]);

  const reset = useCallback(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  return {
    currentStep,
    steps,
    isFirstStep,
    isLastStep,
    progress,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    reset,
  };
}
