import { Octokit } from "@octokit/rest";

export class GitHubClient {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken });
  }

  async listRepositories() {
    // Fetch personal repos with all affiliations (includes org repos if token has access)
    const personalRepos = await this.octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
      affiliation: "owner,collaborator,organization_member",
    });

    console.log(
      "[GITHUB API] Total repos (including org repos):",
      personalRepos.data.length,
    );
    console.log("[GITHUB API] Repo owners:", [
      ...new Set(personalRepos.data.map((r) => r.owner.login)),
    ]);

    return personalRepos.data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      private: repo.private,
    }));
  }

  async listWorkflows(owner: string, repo: string) {
    const { data } = await this.octokit.actions.listRepoWorkflows({
      owner,
      repo,
    });

    return data.workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      path: workflow.path,
      state: workflow.state,
    }));
  }

  async getRecentWorkflowRuns(owner: string, repo: string, workflowId: number) {
    const { data } = await this.octokit.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: workflowId,
      per_page: 5,
    });

    return data.workflow_runs.map((run) => ({
      id: run.id,
      status: run.status,
      conclusion: run.conclusion,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
    }));
  }

  async listWebhooks(owner: string, repo: string) {
    const { data } = await this.octokit.repos.listWebhooks({
      owner,
      repo,
    });

    return data;
  }

  async createWebhook(
    owner: string,
    repo: string,
    webhookUrl: string,
    secret: string,
  ) {
    // Check if webhook already exists
    const existingWebhooks = await this.listWebhooks(owner, repo);
    const existingWebhook = existingWebhooks.find(
      (hook) => hook.config?.url === webhookUrl,
    );

    if (existingWebhook) {
      return existingWebhook; // Return existing webhook instead of creating duplicate
    }

    const { data } = await this.octokit.repos.createWebhook({
      owner,
      repo,
      config: {
        url: webhookUrl,
        content_type: "json",
        secret,
      },
      events: ["workflow_run", "deployment", "deployment_status"],
    });

    return data;
  }
}
