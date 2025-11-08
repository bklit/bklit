"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Glow, GlowArea } from "@bklit/ui/components/glow";
import { parseAsInteger, useQueryState } from "nuqs";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useState,
} from "react";

interface StepperContextValue {
  currentStep: number;
  totalSteps: number;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: number) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
}

const StepperContext = createContext<StepperContextValue | null>(null);

export const useStepper = () => {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error("useStepper must be used within a Stepper");
  }
  return context;
};

interface StepperProps {
  children: React.ReactNode;
}

interface StepperItemProps {
  children: React.ReactNode;
}

interface StepperContentProps {
  children: React.ReactNode;
}

interface StepperFooterProps {
  children: React.ReactNode;
}

interface StepperTitleProps {
  children: React.ReactNode;
}

const Stepper = ({ children }: StepperProps) => {
  // Use nuqs to sync step with URL query parameter (1-indexed in URL, 0-indexed internally)
  const [stepParam, setStepParam] = useQueryState(
    "step",
    parseAsInteger.withDefault(1),
  );
  const [isConnected, setIsConnected] = useState(false);

  const steps = Children.toArray(children).filter(isValidElement);
  const totalSteps = steps.length;

  // Convert from 1-indexed URL param to 0-indexed internal state
  const currentStep = Math.max(0, Math.min(stepParam - 1, totalSteps - 1));

  const goToNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setStepParam(currentStep + 2); // +2 because we need 1-indexed
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setStepParam(currentStep); // currentStep is already the previous step (0-indexed)
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setStepParam(step + 1); // Convert to 1-indexed
    }
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const contextValue: StepperContextValue = {
    currentStep,
    totalSteps,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    isFirstStep,
    isLastStep,
    isConnected,
    setIsConnected,
  };

  const currentStepContent = steps[currentStep];

  // Check if current step has a custom title
  const hasCustomTitle = isValidElement(currentStepContent)
    ? Children.toArray(
        (currentStepContent.props as StepperItemProps).children,
      ).some((child) => isValidElement(child) && child.type === StepperTitle)
    : false;

  const customTitle = hasCustomTitle
    ? Children.toArray(
        isValidElement(currentStepContent)
          ? (currentStepContent.props as StepperItemProps).children
          : [],
      ).find((child) => isValidElement(child) && child.type === StepperTitle)
    : null;

  return (
    <StepperContext.Provider value={contextValue}>
      <GlowArea
        glowPosition={isConnected ? "center center" : "bottom right"}
        size={isConnected ? 800 : 300}
        transitionDuration={isConnected ? 1000 : 500}
      >
        <Glow
          className="rounded-xl"
          color={isConnected ? "rgb(16 185 129)" : "blue"}
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {customTitle && isValidElement(customTitle)
                  ? (customTitle.props as StepperTitleProps).children
                  : `Step ${currentStep + 1} of ${totalSteps}`}
              </CardTitle>
            </CardHeader>
            {currentStepContent}
          </Card>
        </Glow>
      </GlowArea>
    </StepperContext.Provider>
  );
};

const StepperItem = ({ children }: StepperItemProps) => {
  // Filter out StepperTitle from rendering in the body (it's only for the header)
  const filteredChildren = Children.toArray(children).filter(
    (child) => !isValidElement(child) || child.type !== StepperTitle,
  );
  return <>{filteredChildren}</>;
};

const StepperContent = ({ children }: StepperContentProps) => {
  return <CardContent>{children}</CardContent>;
};

const StepperFooter = ({ children }: StepperFooterProps) => {
  return <CardFooter className="flex justify-between">{children}</CardFooter>;
};

const StepperTitle = ({ children }: StepperTitleProps) => {
  // This is just a marker component, actual rendering happens in Stepper
  return <>{children}</>;
};

Stepper.Item = StepperItem;
Stepper.Content = StepperContent;
Stepper.Footer = StepperFooter;
Stepper.Title = StepperTitle;

export default Stepper;
