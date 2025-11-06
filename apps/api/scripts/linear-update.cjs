#!/usr/bin/env node
// Update Linear issues' state by identifier, using team key workflow states

const API_URL = 'https://api.linear.app/graphql'
const API_KEY = process.env.LINEAR_API_KEY
const TEAM_KEY = process.env.LINEAR_TEAM_KEY || 'ZES'
if (!API_KEY) {
  console.error('Missing LINEAR_API_KEY')
  process.exit(1)
}

async function gql(query, variables) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: API_KEY },
    body: JSON.stringify({ query, variables }),
  })
  const data = await res.json()
  if (data.errors) throw new Error(JSON.stringify(data.errors))
  return data.data
}

async function getTeamAndStates(teamKey) {
  // Some Linear plans/APIs expose states via "states" instead of workflowStates
  const q = `query($first:Int!){ teams(first:$first){nodes{id key name states { nodes { id name } } } } }`
  const d = await gql(q, { first: 50 })
  const team = d.teams.nodes.find((t) => t.key === teamKey)
  if (!team) throw new Error(`Team not found: ${teamKey}`)
  const states = team.states?.nodes || []
  if (!states.length) throw new Error('No states retrieved for team')
  return { teamId: team.id, states }
}

async function getIssueId(identifier) {
  // Fallback: search issues by filter
  const q = `query($query:String!){ issues(filter:{ query:$query }, first:10){ nodes{ id identifier } } }`
  const d = await gql(q, { query: identifier })
  const node = d.issues?.nodes?.find((n) => n.identifier === identifier)
  return node?.id || null
}

async function updateIssueState(issueId, stateId) {
  const m = `mutation($id:String!,$stateId:String!){ issueUpdate(id:$id, input:{ stateId:$stateId }){ success issue{ id identifier state{ name } } } }`
  const d = await gql(m, { id: issueId, stateId })
  return d.issueUpdate
}

async function main() {
  // expected input via env or inline here
  // Format: IDENTIFIER=STATE_NAME pairs, comma separated
  const updatesArg = process.env.LINEAR_UPDATES || ''
  if (!updatesArg) {
    console.log('No updates provided. Set LINEAR_UPDATES="ZES-172=Done,ZES-174=Done"')
    process.exit(0)
  }

  const { states } = await getTeamAndStates(TEAM_KEY)
  const stateByName = new Map(states.map((s) => [s.name.toLowerCase(), s.id]))

  const pairs = updatesArg.split(',').map((p) => p.trim()).filter(Boolean)
  for (const pair of pairs) {
    const [identifier, stateNameRaw] = pair.split('=')
    const stateName = (stateNameRaw || '').trim()
    const stateId = stateByName.get(stateName.toLowerCase())
    if (!stateId) {
      console.error(`State not found: ${stateName}`)
      continue
    }
    const issueId = await getIssueId(identifier.trim())
    if (!issueId) {
      console.error(`Issue not found: ${identifier}`)
      continue
    }
    const res = await updateIssueState(issueId, stateId)
    if (res?.success) {
      console.log(`Updated ${identifier} -> ${stateName}`)
    } else {
      console.error(`Failed to update ${identifier}`)
    }
  }
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})


