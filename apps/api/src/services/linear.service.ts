import { GraphQLClient } from 'graphql-request'

const LINEAR_API_URL = 'https://api.linear.app/graphql'

export interface LinearIssueInput {
  title: string
  description?: string
  teamId: string
  assigneeId?: string
  priority?: number
  stateId?: string
  projectId?: string
  labelIds?: string[]
  dueDate?: string
}

export interface LinearIssue {
  id: string
  title: string
  description?: string
  url: string
  identifier: string
  state: {
    id: string
    name: string
    type: string
  }
  assignee?: {
    id: string
    name: string
    email: string
  }
  priority: number
  createdAt: string
  updatedAt: string
}

export interface LinearTeam {
  id: string
  name: string
  key: string
}

export interface LinearState {
  id: string
  name: string
  type: string
}

export class LinearService {
  private client: GraphQLClient

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Linear API key is required')
    }
    this.client = new GraphQLClient(LINEAR_API_URL, {
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * 创建Issue
   */
  async createIssue(input: LinearIssueInput): Promise<LinearIssue> {
    const mutation = `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            title
            description
            url
            identifier
            state {
              id
              name
              type
            }
            assignee {
              id
              name
              email
            }
            priority
            createdAt
            updatedAt
          }
        }
      }
    `

    const variables = {
      input: {
        title: input.title,
        description: input.description || '',
        teamId: input.teamId,
        assigneeId: input.assigneeId,
        priority: input.priority,
        stateId: input.stateId,
        projectId: input.projectId,
        labelIds: input.labelIds,
        dueDate: input.dueDate,
      },
    }

    try {
      const data = await this.client.request<{
        issueCreate: {
          success: boolean
          issue: LinearIssue
        }
      }>(mutation, variables)

      if (!data.issueCreate.success) {
        throw new Error('Failed to create issue in Linear')
      }

      return data.issueCreate.issue
    } catch (error) {
      throw new Error(`Linear API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取所有团队
   */
  async getTeams(): Promise<LinearTeam[]> {
    const query = `
      query GetTeams {
        teams {
          nodes {
            id
            name
            key
          }
        }
      }
    `

    try {
      const data = await this.client.request<{
        teams: {
          nodes: LinearTeam[]
        }
      }>(query)

      return data.teams.nodes
    } catch (error) {
      throw new Error(`Linear API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取团队的状态
   */
  async getTeamStates(teamId: string): Promise<LinearState[]> {
    const query = `
      query GetTeamStates($teamId: String!) {
        team(id: $teamId) {
          states {
            nodes {
              id
              name
              type
            }
          }
        }
      }
    `

    try {
      const data = await this.client.request<{
        team: {
          states: {
            nodes: LinearState[]
          }
        }
      }>(query, { teamId })

      return data.team.states.nodes
    } catch (error) {
      throw new Error(`Linear API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取Issue详情
   */
  async getIssue(issueId: string): Promise<LinearIssue | null> {
    const query = `
      query GetIssue($id: String!) {
        issue(id: $id) {
          id
          title
          description
          url
          identifier
          state {
            id
            name
            type
          }
          assignee {
            id
            name
            email
          }
          priority
          createdAt
          updatedAt
        }
      }
    `

    try {
      const data = await this.client.request<{
        issue: LinearIssue | null
      }>(query, { id: issueId })

      return data.issue
    } catch (error) {
      throw new Error(`Linear API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 更新Issue
   */
  async updateIssue(issueId: string, input: Partial<LinearIssueInput>): Promise<LinearIssue> {
    const mutation = `
      mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
          issue {
            id
            title
            description
            url
            identifier
            state {
              id
              name
              type
            }
            assignee {
              id
              name
              email
            }
            priority
            createdAt
            updatedAt
          }
        }
      }
    `

    const variables = {
      id: issueId,
      input: {
        title: input.title,
        description: input.description,
        assigneeId: input.assigneeId,
        priority: input.priority,
        stateId: input.stateId,
        projectId: input.projectId,
        labelIds: input.labelIds,
        dueDate: input.dueDate,
      },
    }

    try {
      const data = await this.client.request<{
        issueUpdate: {
          success: boolean
          issue: LinearIssue
        }
      }>(mutation, variables)

      if (!data.issueUpdate.success) {
        throw new Error('Failed to update issue in Linear')
      }

      return data.issueUpdate.issue
    } catch (error) {
      throw new Error(`Linear API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 搜索Issues
   */
  async searchIssues(query: string, teamId?: string): Promise<LinearIssue[]> {
    const searchQuery = `
      query SearchIssues($filter: IssueFilter) {
        issues(filter: $filter, first: 50) {
          nodes {
            id
            title
            description
            url
            identifier
            state {
              id
              name
              type
            }
            assignee {
              id
              name
              email
            }
            priority
            createdAt
            updatedAt
          }
        }
      }
    `

    const filter: any = {}
    if (teamId) {
      filter.team = { id: { eq: teamId } }
    }

    try {
      const data = await this.client.request<{
        issues: {
          nodes: LinearIssue[]
        }
      }>(searchQuery, { filter })

      // 简单过滤，Linear的搜索需要更复杂的filter
      const filtered = data.issues.nodes.filter((issue) =>
        issue.title.toLowerCase().includes(query.toLowerCase()) ||
        issue.description?.toLowerCase().includes(query.toLowerCase())
      )

      return filtered
    } catch (error) {
      throw new Error(`Linear API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// 单例实例
let linearServiceInstance: LinearService | null = null

export function getLinearService(): LinearService {
  const apiKey = process.env.LINEAR_API_KEY
  if (!apiKey) {
    throw new Error('LINEAR_API_KEY environment variable is not set')
  }

  if (!linearServiceInstance) {
    linearServiceInstance = new LinearService(apiKey)
  }

  return linearServiceInstance
}

