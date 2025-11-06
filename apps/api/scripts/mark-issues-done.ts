/**
 * Mark issues as Done
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

// Issues to mark as Done
const issuesToComplete = ['ZES-114', 'ZES-115']

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
        }
      }
    }
  `

  const data: any = await client.request(query, { identifier })
  return data.issue
}

async function getDoneStateId() {
  const query = `
    query GetWorkflowStates {
      workflowStates(filter: { name: { eq: "Done" } }) {
        nodes {
          id
          name
        }
      }
    }
  `

  const data: any = await client.request(query)
  return data.workflowStates.nodes[0]?.id
}

async function markIssueDone(issueId: string, stateId: string, identifier: string, title: string) {
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

  const data: any = await client.request(mutation, { issueId, stateId })
  if (data.issueUpdate.success) {
    console.log(`✅ ${identifier}: "${title}" → ${data.issueUpdate.issue.state.name}`)
  } else {
    console.log(`❌ Failed to update ${identifier}`)
  }
  return data.issueUpdate.success
}

async function main() {
  console.log('🎯 Marking issues as Done...\n')

  // Get Done state ID
  const doneStateId = await getDoneStateId()
  if (!doneStateId) {
    console.error('❌ Could not find "Done" state')
    process.exit(1)
  }

  console.log(`📋 Found "Done" state ID: ${doneStateId}\n`)

  let completed = 0

  for (const identifier of issuesToComplete) {
    try {
      const issue = await getIssueId(identifier)
      if (issue) {
        const success = await markIssueDone(issue.id, doneStateId, identifier, issue.title)
        if (success) completed++
      } else {
        console.log(`⚠️  ${identifier}: Not found`)
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error: any) {
      console.error(`❌ Error updating ${identifier}:`, error.message)
    }
  }

  console.log(`\n✅ Marked ${completed}/${issuesToComplete.length} issues as Done`)
}

main()
