#!/usr/bin/env node
// CommonJS version for Node with "type": "module" package scopes

const fs = require('fs');
const path = require('path');

const API_URL = 'https://api.linear.app/graphql';

async function graphql(query, variables) {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) throw new Error('Missing env LINEAR_API_KEY');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Linear API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  if (data.errors) {
    throw new Error(`Linear GraphQL errors: ${JSON.stringify(data.errors)}`);
  }
  return data.data;
}

async function listTeams(first = 50) {
  const data = await graphql(
    `query Teams($first: Int!) { teams(first: $first) { nodes { id key name } } }`,
    { first }
  );
  return data.teams?.nodes || [];
}

async function getTeamId() {
  const teamKey = process.env.LINEAR_TEAM_KEY;
  const teamId = process.env.LINEAR_TEAM_ID;
  if (teamId) return teamId;
  if (!teamKey) throw new Error('Missing LINEAR_TEAM_KEY or LINEAR_TEAM_ID');
  // Linear API 可能不支持 teamByKey，退化为列出团队后本地匹配
  const teams = await listTeams(100);
  const found = teams.find((t) => t.key?.toUpperCase() === String(teamKey).toUpperCase());
  if (!found) throw new Error(`Team not found by key: ${teamKey}`);
  return found.id;
}

async function createIssue(teamId, title, description, projectId) {
  const data = await graphql(
    `mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) { success issue { id identifier url title } }
    }`,
    {
      input: {
        teamId,
        title,
        description,
        projectId: projectId || null,
        priority: 0,
      },
    }
  );
  if (!data.issueCreate?.success) throw new Error('Failed to create issue');
  return data.issueCreate.issue;
}

async function main() {
  const arg = process.argv[2] || path.join(__dirname, 'tasks.linear.json');

  if (arg === '--check') {
    const teams = await listTeams(50);
    if (!teams.length) {
      console.log('No teams visible with this API key.');
      return;
    }
    console.log('Visible teams:');
    for (const t of teams) console.log(`${t.key}\t${t.name}\t${t.id}`);
    return;
  }

  const file = arg;
  if (!fs.existsSync(file)) throw new Error(`Tasks file not found: ${file}`);
  const tasks = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(tasks)) throw new Error('Tasks file must be an array');

  const teamId = await getTeamId();
  const projectId = process.env.LINEAR_PROJECT_ID || null;

  const results = [];
  for (const t of tasks) {
    const title = t.title || t.content || 'Untitled task';
    const description = t.description || t.notes || '';
    const issue = await createIssue(teamId, title, description, projectId);
    results.push({ title, url: issue.url, id: issue.id });
    console.log(`Created: ${title} -> ${issue.url}`);
  }

  const outPath = path.join(path.dirname(file), 'tasks.linear.result.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nSaved results to ${outPath}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});


