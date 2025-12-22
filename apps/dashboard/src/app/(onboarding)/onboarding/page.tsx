"use client";

import { Button } from "@bklit/ui/components/button";
import NumberFlow from "@number-flow/react";
import { useRouter } from "next/navigation";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { CreateProjectStepForm } from "@/components/forms/onboarding/create-project-step-form";
import { CreateWorkspaceStepForm } from "@/components/forms/onboarding/create-workspace-step-form";
import { SDKConnectionStepForm } from "@/components/forms/onboarding/sdk-connection-step-form";
import { TestConnectionStepForm } from "@/components/forms/onboarding/test-connection-step-form";
import Stepper, { useStepper } from "../components/stepper";

function CreateWorkspaceStep({
  onSuccess,
}: {
  onSuccess: (orgId: string) => void;
}) {
  const { goToNextStep } = useStepper();
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = (orgId: string) => {
    onSuccess(orgId);
    goToNextStep();
  };

  return (
    <>
      <Stepper.Content>
        <CreateWorkspaceStepForm
          onLoadingChange={setIsLoading}
          onSuccess={handleSuccess}
        />
      </Stepper.Content>
      <Stepper.Footer>
        <div />
        <Button disabled={isLoading} form="create-workspace-form" type="submit">
          {isLoading ? "Creating..." : "Next"}
        </Button>
      </Stepper.Footer>
    </>
  );
}

function CreateProjectStep({
  organizationId,
  onSuccess,
}: {
  organizationId: string;
  onSuccess: (
    projectId: string,
    projectName: string,
    projectDomain: string
  ) => void;
}) {
  const { goToNextStep } = useStepper();
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = (
    projectId: string,
    projectName: string,
    projectDomain: string
  ) => {
    onSuccess(projectId, projectName, projectDomain);
    goToNextStep();
  };

  return (
    <>
      <Stepper.Content>
        <CreateProjectStepForm
          onLoadingChange={setIsLoading}
          onSuccess={handleSuccess}
          organizationId={organizationId}
        />
      </Stepper.Content>
      <Stepper.Footer>
        <div />
        <Button disabled={isLoading} form="create-project-form" type="submit">
          {isLoading ? "Creating..." : "Next"}
        </Button>
      </Stepper.Footer>
    </>
  );
}

function SDKConnectionStep({
  organizationId,
  projectId,
  projectName,
  projectDomain,
  onTokenCreated,
}: {
  organizationId: string;
  projectId: string;
  projectName: string;
  projectDomain: string;
  onTokenCreated: () => void;
}) {
  const { goToNextStep } = useStepper();
  const router = useRouter();

  const handleTokenCreated = () => {
    onTokenCreated();
  };

  const handleSkip = () => {
    // Validate IDs before navigation
    if (!organizationId || organizationId.trim() === "") {
      toast.error("Organization ID is missing. Please complete step 1 first.");
      return;
    }
    if (!projectId || projectId.trim() === "") {
      toast.error("Project ID is missing. Please complete step 2 first.");
      return;
    }

    // Skip testing and go straight to dashboard with onboarding param
    router.push(`/${organizationId}/${projectId}?onboarding=new`);
  };

  return (
    <>
      <Stepper.Content>
        <SDKConnectionStepForm
          onTokenCreated={handleTokenCreated}
          organizationId={organizationId}
          projectDomain={projectDomain}
          projectId={projectId}
          projectName={projectName}
        />
      </Stepper.Content>
      <Stepper.Footer>
        <Button onClick={handleSkip} variant="ghost">
          Skip for now
        </Button>
        <Button onClick={goToNextStep}>Next</Button>
      </Stepper.Footer>
    </>
  );
}

function TestConnectionStep({
  organizationId,
  projectId,
  projectDomain,
}: {
  organizationId: string;
  projectId: string;
  projectDomain: string;
}) {
  return (
    <>
      <Stepper.Content>
        <TestConnectionStepForm
          organizationId={organizationId}
          projectDomain={projectDomain}
          projectId={projectId}
        />
      </Stepper.Content>
      <Stepper.Footer>
        <div />
        <div />
      </Stepper.Footer>
    </>
  );
}

function OnboardingPageContent() {
  // Use nuqs for URL-based state (for testing/debugging)
  const [stepParam, setStepParam] = useQueryState(
    "step",
    parseAsInteger.withDefault(1)
  );
  const [orgIdParam] = useQueryState("organizationId", parseAsString);
  const [projectIdParam] = useQueryState("projectId", parseAsString);
  const [projectNameParam] = useQueryState("projectName", parseAsString);
  const [projectDomainParam] = useQueryState("projectDomain", parseAsString);

  // Set initial step in URL if not present
  useEffect(() => {
    if (stepParam === 1 && !window.location.search.includes("step=")) {
      setStepParam(1);
    }
  }, [stepParam, setStepParam]);

  // Local state for actual flow
  const [organizationId, setOrganizationId] = useState<string>("");
  const [projectData, setProjectData] = useState<{
    id: string;
    name: string;
    domain: string;
  } | null>(null);
  const [tokenCreated, setTokenCreated] = useState(false);

  const handleWorkspaceSuccess = (orgId: string) => {
    setOrganizationId(orgId);
  };

  const handleProjectSuccess = (
    projectId: string,
    projectName: string,
    projectDomain: string
  ) => {
    setProjectData({ id: projectId, name: projectName, domain: projectDomain });
  };

  const handleTokenCreated = () => {
    setTokenCreated(true);
  };

  // Use URL params if available (for testing), otherwise use state
  const effectiveOrgId = organizationId || orgIdParam || "";
  const effectiveProjectData =
    projectData ||
    (projectIdParam && projectNameParam && projectDomainParam
      ? {
          id: projectIdParam,
          name: projectNameParam,
          domain: projectDomainParam,
        }
      : null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between gap-2 px-3">
        <h1 className="font-semibold text-2xl">Let's get you setup</h1>
        <div className="block align-text-bottom">
          <span className="mr-2 text-muted-foreground text-sm">Step</span>
          <NumberFlow
            className="font-bold text-2xl [&::part(suffix)]:ml-1 [&::part(suffix)]:font-normal [&::part(suffix)]:text-bklit-300 [&::part(suffix)]:text-sm"
            format={{ notation: "compact" }}
            suffix="/4"
            value={stepParam}
          />
        </div>
      </div>
      <Stepper>
        <Stepper.Item>
          <Stepper.Title>Create your workspace</Stepper.Title>
          <CreateWorkspaceStep onSuccess={handleWorkspaceSuccess} />
        </Stepper.Item>
        <Stepper.Item>
          <Stepper.Title>Create your project</Stepper.Title>
          {effectiveOrgId ? (
            <CreateProjectStep
              onSuccess={handleProjectSuccess}
              organizationId={effectiveOrgId}
            />
          ) : (
            <Stepper.Content>
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-sm">
                  Please complete step 1 first to create a workspace.
                </p>
                <p className="mt-2 text-xs">
                  For testing: Add{" "}
                  <code className="rounded bg-muted px-1">
                    ?organizationId=YOUR_ORG_ID
                  </code>{" "}
                  to the URL.
                </p>
              </div>
            </Stepper.Content>
          )}
        </Stepper.Item>
        <Stepper.Item>
          <Stepper.Title>Install the SDK</Stepper.Title>
          {effectiveProjectData ? (
            <SDKConnectionStep
              onTokenCreated={handleTokenCreated}
              organizationId={effectiveOrgId}
              projectDomain={effectiveProjectData.domain}
              projectId={effectiveProjectData.id}
              projectName={effectiveProjectData.name}
            />
          ) : (
            <Stepper.Content>
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-sm">
                  Please complete step 2 first to create a project.
                </p>
                <p className="mt-2 text-xs">
                  For testing: Add{" "}
                  <code className="rounded bg-muted px-1">
                    ?projectId=ID&projectName=NAME&projectDomain=DOMAIN
                  </code>{" "}
                  to the URL.
                </p>
              </div>
            </Stepper.Content>
          )}
        </Stepper.Item>
        <Stepper.Item>
          <Stepper.Title>Test Connection</Stepper.Title>
          {effectiveProjectData && tokenCreated ? (
            <TestConnectionStep
              organizationId={effectiveOrgId}
              projectDomain={effectiveProjectData.domain}
              projectId={effectiveProjectData.id}
            />
          ) : (
            <Stepper.Content>
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-sm">
                  Please complete step 3 first to install the SDK.
                </p>
              </div>
            </Stepper.Content>
          )}
        </Stepper.Item>
      </Stepper>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          Loading...
        </div>
      }
    >
      <OnboardingPageContent />
    </Suspense>
  );
}
