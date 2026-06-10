import { logger } from '#lib/logger';
import { secrets } from '#lib/env';
import { toPunycodeDomainName } from '@namefi-astra/registrars/data/validations';

export interface VercelDomain {
  name: string;
  verified: boolean;
  verification: {
    type: string;
    domain: string;
  }[];
  projectId?: string;
}

export interface VercelProject {
  id: string;
  name: string;
  domains: VercelDomain[];
  team?: {
    id: string;
    slug: string;
  };
}

export class VercelClient {
  private readonly apiToken: string;
  private readonly teamId?: string;
  private readonly baseUrl = 'https://api.vercel.com';

  constructor(apiToken: string, teamId?: string) {
    this.apiToken = apiToken;
    this.teamId = teamId;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add team ID to URL if available
    const searchParams = new URLSearchParams();
    if (this.teamId) {
      searchParams.set('teamId', this.teamId);
    }
    const urlWithParams = searchParams.toString()
      ? `${url}?${searchParams}`
      : url;

    const response = await fetch(urlWithParams, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        {
          status: response.status,
          statusText: response.statusText,
          url: urlWithParams,
          error: errorText,
        },
        'Vercel API request failed',
      );
      throw new Error(
        `Vercel API error: ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  /**
   * Get project by name with pagination support
   */
  async getProject(projectName: string): Promise<VercelProject | null> {
    try {
      let allProjects: VercelProject[] = [];
      let nextUrl: string | null = '/v9/projects';
      let page = 1;

      while (nextUrl) {
        const response: {
          projects: VercelProject[];
          pagination?: { next?: string };
        } = await this.request(nextUrl);

        allProjects = [...allProjects, ...response.projects];

        // Check if we found the project
        const project = allProjects.find((p) => p.name === projectName);
        if (project) {
          return project;
        }

        if (response.pagination?.next) {
          nextUrl = response.pagination.next;
          page++;
          logger.debug({ projectName, page }, 'Fetching next page of projects');
        } else {
          nextUrl = null;
        }
      }

      logger.debug({ projectName }, 'Project not found in any page');
      return null;
    } catch (error) {
      logger.error({ error, projectName }, 'Failed to get Vercel project');
      return null;
    }
  }

  /**
   * Get project by slug (team/project format)
   */
  async getProjectBySlug(projectSlug: string): Promise<VercelProject | null> {
    try {
      if (!this.teamId) {
        throw new Error('Team ID is required to get project by slug');
      }

      // First try the direct endpoint
      try {
        const response = await this.request<VercelProject>(
          `/v9/projects/${this.teamId}/${projectSlug}`,
        );
        return response;
      } catch (error) {
        // If direct endpoint fails, search through all projects
        logger.debug(
          { error, projectSlug, teamId: this.teamId },
          'Direct project lookup failed, trying search',
        );

        let allProjects: VercelProject[] = [];
        let nextUrl: string | null = '/v9/projects';
        let page = 1;

        while (nextUrl) {
          const response: {
            projects: VercelProject[];
            pagination?: { next?: string };
          } = await this.request(nextUrl);

          allProjects = [...allProjects, ...response.projects];

          // Check if we found the project by slug (name)
          const project = allProjects.find((p) => p.name === projectSlug);
          if (project) {
            return project;
          }

          if (response.pagination?.next) {
            nextUrl = response.pagination.next;
            page++;
            logger.debug(
              { projectSlug, page },
              'Fetching next page of projects',
            );
          } else {
            nextUrl = null;
          }
        }

        logger.debug({ projectSlug }, 'Project not found in any page');
        return null;
      }
    } catch (error) {
      logger.error(
        { error, projectSlug, teamId: this.teamId },
        'Failed to get Vercel project by slug',
      );
      return null;
    }
  }

  /**
   * Add domain to project
   */
  async addDomainToProject(
    projectId: string,
    domain: string,
  ): Promise<VercelDomain> {
    return this.request<VercelDomain>(`/v10/projects/${projectId}/domains`, {
      method: 'POST',
      body: JSON.stringify({ name: domain }),
    });
  }

  /**
   * Get domains for a project with pagination support
   */
  async getProjectDomains(projectId: string): Promise<VercelDomain[]> {
    let allDomains: VercelDomain[] = [];
    let nextUrl: string | null = `/v9/projects/${projectId}/domains`;
    let page = 1;

    while (nextUrl) {
      const response: {
        domains: VercelDomain[];
        pagination?: { next?: string };
      } = await this.request(nextUrl);

      allDomains = [...allDomains, ...response.domains];

      if (response.pagination?.next) {
        nextUrl = response.pagination.next;
        page++;
        logger.debug({ projectId, page }, 'Fetching next page of domains');
      } else {
        nextUrl = null;
      }
    }

    logger.debug(
      { projectId, count: allDomains.length },
      'Vercel project domains',
    );
    return allDomains;
  }

  /**
   * Check if domain is configured in project
   */
  async isDomainInProject(projectId: string, domain: string): Promise<boolean> {
    try {
      const domains = await this.getProjectDomains(projectId);
      console.log(
        'domains',
        domains.map((d) => toPunycodeDomainName(d.name)),
      );
      return domains.some(
        (d) => toPunycodeDomainName(d.name) === toPunycodeDomainName(domain),
      );
    } catch (error) {
      logger.error(
        { error, projectId, domain },
        'Failed to check if domain is in project',
      );
      return false;
    }
  }

  /**
   * Remove domain from project
   */
  async removeDomainFromProject(
    projectId: string,
    domain: string,
  ): Promise<void> {
    await this.request(`/v9/projects/${projectId}/domains/${domain}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get domain configuration including IP addresses
   */
  async getDomainConfig(domain: string): Promise<VercelDomain | null> {
    try {
      return await this.request<VercelDomain>(`/v6/domains/${domain}`);
    } catch (error) {
      logger.error({ error, domain }, 'Failed to get domain config');
      return null;
    }
  }
}

// Factory function to create Vercel client with environment configuration
export function createVercelClient(): VercelClient {
  const apiToken = secrets.VERCEL_API_TOKEN;
  const teamId = secrets.VERCEL_TEAM_ID;

  if (!apiToken) {
    throw new Error('VERCEL_API_TOKEN is required');
  }

  return new VercelClient(apiToken, teamId);
}
