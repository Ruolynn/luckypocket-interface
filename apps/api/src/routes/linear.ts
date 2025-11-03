import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getLinearService } from '../services/linear.service'

const createIssueSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  teamId: z.string(),
  assigneeId: z.string().optional(),
  priority: z.number().int().min(0).max(4).optional(),
  stateId: z.string().optional(),
  projectId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional(),
})

const updateIssueSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.number().int().min(0).max(4).optional(),
  stateId: z.string().optional(),
  projectId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional(),
})

const plugin: FastifyPluginAsync = async (app) => {
  // 创建Issue
  // 注意：生产环境建议启用认证，取消下面的注释并注释掉空对象
  app.post(
    '/api/linear/issues',
    {
      // preHandler: (app as any).authenticate ? [app.authenticate as any] : undefined,
    },
    async (req: any, reply) => {
      try {
        const input = createIssueSchema.parse(req.body)
        const linearService = getLinearService()
        const issue = await linearService.createIssue(input)
        return reply.code(201).send(issue)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'VALIDATION_ERROR', details: error.errors })
        }
        app.log.error(error, 'Failed to create Linear issue')
        return reply.code(500).send({
          error: 'FAILED_TO_CREATE_ISSUE',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  )

  // 获取所有团队
  app.get('/api/linear/teams', async (req: any, reply) => {
    try {
      const linearService = getLinearService()
      const teams = await linearService.getTeams()
      return reply.send(teams)
    } catch (error) {
      app.log.error(error, 'Failed to get Linear teams')
      return reply.code(500).send({
        error: 'FAILED_TO_GET_TEAMS',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // 获取团队的状态
  app.get('/api/linear/teams/:teamId/states', async (req: any, reply) => {
    try {
      const { teamId } = req.params as { teamId: string }
      const linearService = getLinearService()
      const states = await linearService.getTeamStates(teamId)
      return reply.send(states)
    } catch (error) {
      app.log.error(error, 'Failed to get team states')
      return reply.code(500).send({
        error: 'FAILED_TO_GET_STATES',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // 获取Issue详情
  app.get('/api/linear/issues/:issueId', async (req: any, reply) => {
    try {
      const { issueId } = req.params as { issueId: string }
      const linearService = getLinearService()
      const issue = await linearService.getIssue(issueId)
      if (!issue) {
        return reply.code(404).send({ error: 'ISSUE_NOT_FOUND' })
      }
      return reply.send(issue)
    } catch (error) {
      app.log.error(error, 'Failed to get Linear issue')
      return reply.code(500).send({
        error: 'FAILED_TO_GET_ISSUE',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // 更新Issue
  // 注意：生产环境建议启用认证，取消下面的注释并注释掉空对象
  app.patch(
    '/api/linear/issues/:issueId',
    {
      // preHandler: (app as any).authenticate ? [app.authenticate as any] : undefined,
    },
    async (req: any, reply) => {
      try {
        const { issueId } = req.params as { issueId: string }
        const input = updateIssueSchema.parse(req.body)
        const linearService = getLinearService()
        const issue = await linearService.updateIssue(issueId, input)
        return reply.send(issue)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'VALIDATION_ERROR', details: error.errors })
        }
        app.log.error(error, 'Failed to update Linear issue')
        return reply.code(500).send({
          error: 'FAILED_TO_UPDATE_ISSUE',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  )

  // 搜索Issues
  app.get('/api/linear/issues', async (req: any, reply) => {
    try {
      const { query, teamId } = req.query as { query?: string; teamId?: string }
      if (!query) {
        return reply.code(400).send({ error: 'QUERY_PARAMETER_REQUIRED' })
      }
      const linearService = getLinearService()
      const issues = await linearService.searchIssues(query, teamId)
      return reply.send(issues)
    } catch (error) {
      app.log.error(error, 'Failed to search Linear issues')
      return reply.code(500).send({
        error: 'FAILED_TO_SEARCH_ISSUES',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })
}

export default plugin

