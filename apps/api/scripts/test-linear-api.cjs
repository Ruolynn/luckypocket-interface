#!/usr/bin/env node
/**
 * Test Linear API connection and fetch project
 */

require('dotenv').config();

const API_URL = 'https://api.linear.app/graphql';

async function graphql(query, variables) {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    throw new Error('Missing env LINEAR_API_KEY');
  }

  console.log('Using API key:', apiKey.substring(0, 15) + '...');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await res.text();
  console.log('Response status:', res.status);
  console.log('Response body:', text);

  if (!res.ok) {
    throw new Error(`Linear API error ${res.status}: ${text}`);
  }

  const data = JSON.parse(text);
  if (data.errors) {
    throw new Error(`Linear GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data;
}

async function testConnection() {
  console.log('Testing connection...\n');

  try {
    // Test viewer query
    const viewer = await graphql(`query { viewer { id name email } }`);
    console.log('\n✅ Connection successful!');
    console.log('Viewer:', viewer.viewer);
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

async function listTeams() {
  console.log('\nFetching teams...\n');

  try {
    const data = await graphql(
      `query Teams($first: Int!) { teams(first: $first) { nodes { id key name } } }`,
      { first: 50 }
    );

    console.log('\n✅ Teams found:');
    const teams = data.teams?.nodes || [];
    teams.forEach(t => {
      console.log(`  ${t.key}\t${t.name}\t${t.id}`);
    });

    return teams;
  } catch (error) {
    console.error('❌ Failed to fetch teams:', error.message);
    return [];
  }
}

async function getProject(projectId) {
  console.log(`\nFetching project: ${projectId}...\n`);

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
        teams {
          nodes {
            id
            name
            key
          }
        }
      }
    }
  `;

  try {
    const data = await graphql(query, { projectId });
    console.log('\n✅ Project found:');
    console.log(JSON.stringify(data.project, null, 2));
    return data.project;
  } catch (error) {
    console.error('❌ Failed to fetch project:', error.message);
    return null;
  }
}

async function getProjectIssues(projectId) {
  console.log(`\nFetching issues for project: ${projectId}...\n`);

  const query = `
    query GetProjectIssues($projectId: ID!) {
      project(id: $projectId) {
        id
        name
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
            }
            priority
            assignee {
              id
              name
              email
            }
            createdAt
            updatedAt
            completedAt
          }
        }
      }
    }
  `;

  try {
    const data = await graphql(query, { projectId });
    const issues = data.project?.issues?.nodes || [];
    console.log(`\n✅ Found ${issues.length} issues`);
    return issues;
  } catch (error) {
    console.error('❌ Failed to fetch issues:', error.message);
    return [];
  }
}

async function main() {
  const projectId = process.argv[2] || '90e7347d4faa';

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.log('\n⚠️  Cannot continue without valid API connection');
    process.exit(1);
  }

  // List teams
  await listTeams();

  // Get project
  await getProject(projectId);

  // Get project issues
  await getProjectIssues(projectId);
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message || err);
  process.exit(1);
});
