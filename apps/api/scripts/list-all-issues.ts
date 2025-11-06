/**
 * List all DeGift project issues
 */
import { GraphQLClient } from 'graphql-request'
import 'dotenv/config'

const LINEAR_API_URL = 'https://api.linear.app/graphql'
const LINEAR_API_KEY = process.env.LINEAR_API_KEY

if (!LINEAR_API_KEY) {
  console.error('❌ Error: LINEAR_API_KEY not set')
  process.exit(1)
}

const client = new GraphQLClient(LINEAR_API_URL, {
  headers: {
    Authorization: LINEAR_API_KEY,
    'Content-Type': 'application/json',
  },
})

async function main() {
  const query = `
    query GetAllIssues {
      issues(
        filter: {
          team: { key: { eq: "ZES" } }
        }
        orderBy: createdAt
      ) {
        nodes {
          identifier
          title
          state { name }
          project { name }
        }
      }
    }
  `

  const data: any = await client.request(query)

  // 按项目分组
  const byProject: Record<string, any[]> = {}

  data.issues.nodes.forEach((issue: any) => {
    const projectName = issue.project?.name || '无项目'
    if (!byProject[projectName]) {
      byProject[projectName] = []
    }
    byProject[projectName].push(issue)
  })

  // 只显示 DeGift 项目
  console.log('\n📊 DeGift 项目 Issues 状态：\n')

  const degiftIssues = byProject['DeGift - 去中心化礼物系统'] || []

  // 按状态分组
  const byState: Record<string, any[]> = {}
  degiftIssues.forEach((issue: any) => {
    const state = issue.state.name
    if (!byState[state]) {
      byState[state] = []
    }
    byState[state].push(issue)
  })

  // 显示各状态的 issues
  const stateOrder = ['Done', 'In Progress', 'In Review', 'Backlog', 'Todo', 'Canceled']

  stateOrder.forEach(state => {
    if (byState[state] && byState[state].length > 0) {
      console.log(`\n【${state}】(${byState[state].length} 个):`)
      byState[state].forEach((issue: any) => {
        console.log(`  ${issue.identifier}: ${issue.title}`)
      })
    }
  })

  console.log('\n')
}

main()
