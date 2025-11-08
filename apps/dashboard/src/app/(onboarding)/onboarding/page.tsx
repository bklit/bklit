"use client";

import { Button } from "@bklit/ui/components/button";
import NumberFlow from "@number-flow/react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Suspense, useEffect, useState } from "react";
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
          onSuccess={handleSuccess}
          onLoadingChange={setIsLoading}
        />
      </Stepper.Content>
      <Stepper.Footer>
        <div />
        <Button type="submit" form="create-workspace-form" disabled={isLoading}>
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
    projectDomain: string,
  ) => void;
}) {
  const { goToNextStep } = useStepper();
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccess = (
    projectId: string,
    projectName: string,
    projectDomain: string,
  ) => {
    onSuccess(projectId, projectName, projectDomain);
    goToNextStep();
  };

  return (
    <>
      <Stepper.Content>
        <CreateProjectStepForm
          organizationId={organizationId}
          onSuccess={handleSuccess}
          onLoadingChange={setIsLoading}
        />
      </Stepper.Content>
      <Stepper.Footer>
        <div />
        <Button type="submit" form="create-project-form" disabled={isLoading}>
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

  const handleTokenCreated = () => {
    onTokenCreated();
  };

  return (
    <>
      <Stepper.Content>
        <SDKConnectionStepForm
          organizationId={organizationId}
          projectId={projectId}
          projectName={projectName}
          projectDomain={projectDomain}
          onTokenCreated={handleTokenCreated}
        />
      </Stepper.Content>
      <Stepper.Footer>
        <div />
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
          projectId={projectId}
          projectDomain={projectDomain}
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
    parseAsInteger.withDefault(1),
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
    projectDomain: string,
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
      <div className="flex px-3 gap-2 justify-between">
        <h1 className="text-2xl font-semibold">Let's get you setup</h1>
        <div className="block align-text-bottom">
          <span className="text-sm text-muted-foreground mr-2">Step</span>
          <NumberFlow
            value={stepParam}
            className="text-2xl font-bold [&::part(suffix)]:ml-1 [&::part(suffix)]:font-normal [&::part(suffix)]:text-sm [&::part(suffix)]:text-bklit-300"
            suffix="/4"
            format={{ notation: "compact" }}
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
              organizationId={effectiveOrgId}
              onSuccess={handleProjectSuccess}
            />
          ) : (
            <Stepper.Content>
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">
                  Please complete step 1 first to create a workspace.
                </p>
                <p className="text-xs mt-2">
                  For testing: Add{" "}
                  <code className="bg-muted px-1 rounded">
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
              organizationId={effectiveOrgId}
              projectId={effectiveProjectData.id}
              projectName={effectiveProjectData.name}
              projectDomain={effectiveProjectData.domain}
              onTokenCreated={handleTokenCreated}
            />
          ) : (
            <Stepper.Content>
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">
                  Please complete step 2 first to create a project.
                </p>
                <p className="text-xs mt-2">
                  For testing: Add{" "}
                  <code className="bg-muted px-1 rounded">
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
              projectId={effectiveProjectData.id}
              projectDomain={effectiveProjectData.domain}
            />
          ) : (
            <Stepper.Content>
              <div className="text-center py-8 text-muted-foreground">
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
