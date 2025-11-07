/**
 * @file Update Gift Tasks Status
 * @description Update ZES-77, ZES-78, ZES-80 to In Progress status
 */

import { GraphQLClient } from 'graphql-request'
import 'dotenv/config'

const LINEAR_API_URL = 'https://api.linear.app/graphql'
const LINEAR_API_KEY = process.env.LINEAR_API_KEY

if (!LINEAR_API_KEY) {
  console.error('❌ Error: LINEAR_API_KEY environment variable is not set')
  console.error('Please set LINEAR_API_KEY in apps/api/.env file')
  process.exit(1)
}

const client = new GraphQLClient(LINEAR_API_URL, {
  headers: {
    Authorization: LINEAR_API_KEY,
    'Content-Type': 'application/json',
  },
})

// Issues to update
const issuesToUpdate = [
  { identifier: 'ZES-77', title: '礼物创建界面开发' },
  { identifier: 'ZES-78', title: '礼物展示和领取页面' },
  { identifier: 'ZES-80', title: '移动端适配和优化' },
]

async function getIssueId(identifier: string) {
  const query = `
    query GetIssue($identifier: String!) {
      issue(id: $identifier) {
        id
        identifier
        title
        state {
          id
          name
          type
        }
      }
    }
  `

  try {
    const data: any = await client.request(query, { identifier })
    return data.issue
  } catch (error: any) {
    console.error(`Failed to get issue ${identifier}:`, error.message)
    return null
  }
}

async function getInProgressStateId() {
  const query = `
    query GetWorkflowStates {
      workflowStates(filter: { name: { in: ["In Progress", "进行中"] } }) {
        nodes {
          id
          name
          type
        }
      }
    }
  `

  try {
    const data: any = await client.request(query)
    return data.workflowStates.nodes[0]?.id
  } catch (error: any) {
    console.error('Failed to get In Progress state:', error.message)
    return null
  }
}

async function updateIssueState(
  issueId: string,
  stateId: string,
  identifier: string,
  title: string
) {
  const mutation = `
    mutation UpdateIssue($issueId: String!, $stateId: String!) {
      issueUpdate(
        id: $issueId
        input: { stateId: $stateId }
      ) {
        success
        issue {
          id
          identifier
          title
          state {
            name
          }
        }
      }
    }
  `

  try {
    const data: any = await client.request(mutation, { issueId, stateId })
    if (data.issueUpdate.success) {
      console.log(
        `✅ ${identifier}: ${title} → ${data.issueUpdate.issue.state.name}`
      )
      return true
    }
    return false
  } catch (error: any) {
    console.error(`❌ Failed to update ${identifier}:`, error.message)
    return false
  }
}

async function addCommentToIssue(issueId: string, identifier: string) {
  const comment = `UI 实现已完成并提交到 GitHub！

## 已完成
- ✅ 页面路由实现
- ✅ 组件开发
- ✅ 响应式设计
- ✅ 玻璃态 UI
- ✅ 表单验证

## 待完成
- ⏳ API 集成
- ⏳ 智能合约交互
- ⏳ NFT 元数据获取

**代码已提交**: https://github.com/Zesty-Studio/HongBao/commit/latest`

  const mutation = `
    mutation CreateComment($issueId: String!, $body: String!) {
      commentCreate(
        input: {
          issueId: $issueId
          body: $body
        }
      ) {
        success
        comment {
          id
        }
      }
    }
  `

  try {
    const data: any = await client.request(mutation, { issueId, body: comment })
    if (data.commentCreate.success) {
      console.log(`   💬 Added comment to ${identifier}`)
      return true
    }
    return false
  } catch (error: any) {
    console.error(`   ⚠️  Failed to add comment to ${identifier}:`, error.message)
    return false
  }
}

async function main() {
  console.log('\n🔄 Updating Linear tasks status...\n')

  // Get In Progress state ID
  const inProgressStateId = await getInProgressStateId()
  if (!inProgressStateId) {
    console.error('❌ Could not find In Progress state')
    process.exit(1)
  }

  console.log(`📋 Found "In Progress" state: ${inProgressStateId}\n`)

  let successCount = 0
  let skipCount = 0

  for (const issueInfo of issuesToUpdate) {
    console.log(`\n📌 Processing ${issueInfo.identifier}: ${issueInfo.title}`)

    const issue = await getIssueId(issueInfo.identifier)
    if (!issue) {
      console.log(`   ⚠️  Issue not found or no access`)
      continue
    }

    console.log(`   Current state: ${issue.state.name} (${issue.state.type})`)

    // Skip if already in progress
    if (issue.state.type === 'started') {
      console.log(`   ℹ️  Already in progress, skipping...`)
      skipCount++
      continue
    }

    // Update to In Progress
    const updated = await updateIssueState(
      issue.id,
      inProgressStateId,
      issue.identifier,
      issue.title
    )

    if (updated) {
      successCount++
      // Add a comment
      await addCommentToIssue(issue.id, issue.identifier)
    }

    // Wait a bit between requests
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  console.log('\n' + '━'.repeat(60))
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Updated: ${successCount}`)
  console.log(`   ⏭️  Skipped: ${skipCount}`)
  console.log(`   📝 Total: ${issuesToUpdate.length}\n`)
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message)
  process.exit(1)
})
