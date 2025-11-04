/**
 * @file List Linear Issues
 * @description List all issues from Linear workspace
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

async function listIssues(first: number = 50, filter?: string) {
  const query = `
    query ListIssues($first: Int!) {
      issues(first: $first, orderBy: updatedAt) {
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
          }
          team {
            id
            name
            key
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

  try {
    const data = await client.request<{
      issues: { nodes: any[] }
    }>(query, { first })

    return data.issues.nodes
  } catch (error: any) {
    console.error('❌ Failed to fetch issues:', error.message)
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2))
    }
    throw error
  }
}

async function main() {
  const filterTeam = process.argv[2] // e.g., "ZES"
  const count = parseInt(process.argv[3] || '50')

  console.log(`\n🔍 Fetching Linear issues...`)
  if (filterTeam) {
    console.log(`   Filter: Team key starts with "${filterTeam}"`)
  }
  console.log(`   Limit: ${count}\n`)

  try {
    const issues = await listIssues(count)

    let filtered = issues
    if (filterTeam) {
      filtered = issues.filter((i) => i.identifier.startsWith(filterTeam))
    }

    if (filtered.length === 0) {
      console.log('⚠️  No issues found')
      return
    }

    console.log(`✅ Found ${filtered.length} issue(s):\n`)
    console.log('━'.repeat(100))

    for (const issue of filtered) {
      const priorities = ['No priority', 'Urgent', 'High', 'Medium', 'Low']
      const priority = issue.priority !== undefined ? priorities[issue.priority] : 'Unknown'

      console.log(`\n📋 ${issue.identifier}: ${issue.title}`)
      console.log(`   🏷️  Team: ${issue.team.name} (${issue.team.key})`)
      console.log(`   📊 State: ${issue.state.name} (${issue.state.type})`)
      console.log(`   ⚡ Priority: ${priority}`)

      if (issue.assignee) {
        console.log(`   👤 Assignee: ${issue.assignee.name}`)
      }

      console.log(`   🔗 URL: ${issue.url}`)
      console.log(`   📅 Updated: ${new Date(issue.updatedAt).toLocaleString()}`)

      if (issue.description) {
        const preview = issue.description.slice(0, 150).replace(/\n/g, ' ')
        console.log(`   📄 ${preview}${issue.description.length > 150 ? '...' : ''}`)
      }
    }

    console.log('\n' + '━'.repeat(100))
    console.log(`\n✅ Listed ${filtered.length} issue(s)\n`)
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

main()
