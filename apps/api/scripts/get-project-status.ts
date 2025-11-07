/**
 * @file Get Linear Project Status
 * @description Fetch project details and issues from Linear by project ID
 */

import { GraphQLClient } from 'graphql-request'
import 'dotenv/config'

const LINEAR_API_URL = 'https://api.linear.app/graphql'
const LINEAR_API_KEY = process.env.LINEAR_API_KEY

if (!LINEAR_API_KEY) {
  console.error('❌ Error: LINEAR_API_KEY environment variable is not set')
  process.exit(1)
}

const client = new GraphQLClient(LINEAR_API_URL, {
  headers: {
    Authorization: LINEAR_API_KEY,
    'Content-Type': 'application/json',
  },
})

async function getProjectStatus(projectId: string) {
  const query = `
    query GetProject($projectId: String!) {
      project(id: $projectId) {
        id
        name
        description
        url
        state
        progress
        startDate
        targetDate
        createdAt
        updatedAt
        lead {
          id
          name
          email
        }
        members {
          nodes {
            id
            name
            email
          }
        }
        teams {
          nodes {
            id
            name
            key
          }
        }
        issues {
          nodes {
            id
            identifier
            title
            description
            url
            state {
              id
              name
              type
              color
            }
            priority
            estimate
            assignee {
              id
              name
              email
            }
            labels {
              nodes {
                id
                name
                color
              }
            }
            createdAt
            updatedAt
            completedAt
          }
        }
      }
    }
  `

  try {
    const data = await client.request<{
      project: any
    }>(query, { projectId })

    return data.project
  } catch (error: any) {
    console.error('❌ Failed to fetch project:', error.message)
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2))
    }
    throw error
  }
}

async function main() {
  const projectId = process.argv[2] || '90e7347d4faa'

  console.log(`\n🔍 Fetching Linear project: ${projectId}...\n`)

  try {
    const project = await getProjectStatus(projectId)

    if (!project) {
      console.error('❌ Project not found')
      process.exit(1)
    }

    console.log('✅ Project found:\n')
    console.log('━'.repeat(100))
    console.log(`\n📁 Project: ${project.name}`)
    console.log(`🆔 ID: ${project.id}`)
    console.log(`📊 State: ${project.state}`)
    console.log(`📈 Progress: ${project.progress ? `${(project.progress * 100).toFixed(1)}%` : 'N/A'}`)
    console.log(`🔗 URL: ${project.url}`)

    if (project.lead) {
      console.log(`👤 Lead: ${project.lead.name} (${project.lead.email})`)
    }

    if (project.startDate) {
      console.log(`📅 Start Date: ${new Date(project.startDate).toLocaleDateString()}`)
    }

    if (project.targetDate) {
      console.log(`🎯 Target Date: ${new Date(project.targetDate).toLocaleDateString()}`)
    }

    if (project.description) {
      console.log(`\n📄 Description:`)
      console.log('─'.repeat(100))
      console.log(project.description)
      console.log('─'.repeat(100))
    }

    // Team info
    if (project.teams?.nodes?.length > 0) {
      console.log(`\n🏢 Teams:`)
      project.teams.nodes.forEach((team: any) => {
        console.log(`   • ${team.name} (${team.key})`)
      })
    }

    // Member info
    if (project.members?.nodes?.length > 0) {
      console.log(`\n👥 Members (${project.members.nodes.length}):`)
      project.members.nodes.forEach((member: any) => {
        console.log(`   • ${member.name} (${member.email})`)
      })
    }

    // Issues analysis
    const issues = project.issues?.nodes || []
    console.log(`\n\n📋 ISSUES SUMMARY`)
    console.log('━'.repeat(100))
    console.log(`Total Issues: ${issues.length}`)

    // Status breakdown
    const statusMap = new Map<string, number>()
    const priorityMap = new Map<number, number>()
    const inProgress: any[] = []
    const completed: any[] = []
    const todo: any[] = []

    issues.forEach((issue: any) => {
      // Count by status
      const statusType = issue.state.type
      statusMap.set(statusType, (statusMap.get(statusType) || 0) + 1)

      // Count by priority
      if (issue.priority !== undefined && issue.priority !== null) {
        priorityMap.set(issue.priority, (priorityMap.get(issue.priority) || 0) + 1)
      }

      // Categorize issues
      if (statusType === 'completed') {
        completed.push(issue)
      } else if (statusType === 'started') {
        inProgress.push(issue)
      } else if (statusType === 'unstarted') {
        todo.push(issue)
      }
    })

    // Status distribution
    console.log(`\n📊 Status Distribution:`)
    statusMap.forEach((count, status) => {
      const percentage = ((count / issues.length) * 100).toFixed(1)
      console.log(`   • ${status.toUpperCase()}: ${count} (${percentage}%)`)
    })

    // Priority distribution
    console.log(`\n⚡ Priority Distribution:`)
    const priorities = ['No priority', 'Urgent', 'High', 'Medium', 'Low']
    priorityMap.forEach((count, priority) => {
      const percentage = ((count / issues.length) * 100).toFixed(1)
      console.log(`   • ${priorities[priority] || priority}: ${count} (${percentage}%)`)
    })

    // Current work
    console.log(`\n\n🚀 CURRENTLY IN PROGRESS (${inProgress.length}):`)
    console.log('━'.repeat(100))
    if (inProgress.length > 0) {
      inProgress.forEach((issue: any) => {
        console.log(`\n📌 ${issue.identifier}: ${issue.title}`)
        console.log(`   📊 State: ${issue.state.name}`)
        if (issue.assignee) {
          console.log(`   👤 Assignee: ${issue.assignee.name}`)
        }
        console.log(`   🔗 ${issue.url}`)
      })
    } else {
      console.log('   (No issues in progress)')
    }

    // Completed work
    console.log(`\n\n✅ COMPLETED (${completed.length}):`)
    console.log('━'.repeat(100))
    if (completed.length > 0) {
      completed.forEach((issue: any) => {
        console.log(`\n✓ ${issue.identifier}: ${issue.title}`)
        if (issue.completedAt) {
          console.log(`   📅 Completed: ${new Date(issue.completedAt).toLocaleString()}`)
        }
        console.log(`   🔗 ${issue.url}`)
      })
    } else {
      console.log('   (No completed issues)')
    }

    // Todo work
    console.log(`\n\n📝 TODO / BACKLOG (${todo.length}):`)
    console.log('━'.repeat(100))
    if (todo.length > 0) {
      todo.forEach((issue: any) => {
        const priority = issue.priority !== undefined ? priorities[issue.priority] : 'Unknown'
        console.log(`\n○ ${issue.identifier}: ${issue.title}`)
        console.log(`   ⚡ Priority: ${priority}`)
        if (issue.assignee) {
          console.log(`   👤 Assignee: ${issue.assignee.name}`)
        }
        console.log(`   🔗 ${issue.url}`)
      })
    } else {
      console.log('   (No todo issues)')
    }

    // Summary stats
    console.log(`\n\n📈 SUMMARY STATISTICS`)
    console.log('━'.repeat(100))
    console.log(`Total Issues: ${issues.length}`)
    console.log(`✅ Completed: ${completed.length}`)
    console.log(`🚀 In Progress: ${inProgress.length}`)
    console.log(`📝 Todo/Backlog: ${todo.length}`)
    if (issues.length > 0) {
      console.log(`📊 Completion Rate: ${((completed.length / issues.length) * 100).toFixed(1)}%`)
    }

    console.log('\n' + '━'.repeat(100))
    console.log('\n✅ Report generated successfully!\n')

    // Export to JSON
    const report = {
      project: {
        id: project.id,
        name: project.name,
        state: project.state,
        progress: project.progress,
        url: project.url,
      },
      statistics: {
        total: issues.length,
        completed: completed.length,
        inProgress: inProgress.length,
        todo: todo.length,
        completionRate: issues.length > 0 ? (completed.length / issues.length) * 100 : 0,
      },
      statusDistribution: Object.fromEntries(statusMap),
      priorityDistribution: Object.fromEntries(priorityMap),
      issues: {
        inProgress: inProgress.map((i) => ({
          identifier: i.identifier,
          title: i.title,
          url: i.url,
          state: i.state.name,
          assignee: i.assignee?.name,
        })),
        completed: completed.map((i) => ({
          identifier: i.identifier,
          title: i.title,
          url: i.url,
          completedAt: i.completedAt,
        })),
        todo: todo.map((i) => ({
          identifier: i.identifier,
          title: i.title,
          url: i.url,
          priority: i.priority !== undefined ? priorities[i.priority] : 'Unknown',
          assignee: i.assignee?.name,
        })),
      },
    }

    // Save report to file
    const fs = await import('fs')
    const reportPath = '/Users/lushengqi/工作间/Github/HongBao/apps/api/scripts/project-status-report.json'
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`📄 Detailed report saved to: ${reportPath}\n`)
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

main()
