/**
 * promote-ready.cjs
 * Tự động cập nhật trường Status (Backlog <-> Ready) trên GitHub Projects V2.
 */

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const repoFull = process.env.GH_REPOSITORY || 'khongpc-ptit/pm-subject_gamified-todo-application';
const [repoOwner, repoName] = repoFull.split('/');
const org = process.env.GH_ORGANIZATION || repoOwner;
const projectTitle = process.env.PROJECT_TITLE || 'Gamified todo application - group 5';

if (!token) {
  console.error('[ERROR] Missing GH_TOKEN or GITHUB_TOKEN environment variable.');
  process.exit(1);
}

async function graphql(query, variables = {}) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'promote-ready-script'
    },
    body: JSON.stringify({ query, variables })
  });

  const json = await res.json();
  if (json.errors && json.errors.length > 0) {
    const errMsg = json.errors.map(e => e.message).join('; ');
    throw new Error(`GraphQL Error: ${errMsg}`);
  }
  return json.data;
}

async function findProjectV2() {
  const fieldsFragment = `
    id
    title
    number
    fields(first: 50) {
      nodes {
        ... on ProjectV2SingleSelectField {
          id
          name
          options {
            id
            name
          }
        }
      }
    }
  `;

  const candidates = [];

  // 1. Kiểm tra trong organization
  try {
    const orgData = await graphql(`
      query($org: String!) {
        organization(login: $org) {
          projectsV2(first: 20) {
            nodes {
              ${fieldsFragment}
            }
          }
        }
      }
    `, { org });
    if (orgData?.organization?.projectsV2?.nodes) {
      candidates.push(...orgData.organization.projectsV2.nodes);
    }
  } catch (e) {
    // Không phải org hoặc không có quyền truy vấn org
  }

  // 2. Kiểm tra trong user
  try {
    const userData = await graphql(`
      query($user: String!) {
        user(login: $user) {
          projectsV2(first: 20) {
            nodes {
              ${fieldsFragment}
            }
          }
        }
      }
    `, { user: org });
    if (userData?.user?.projectsV2?.nodes) {
      candidates.push(...userData.user.projectsV2.nodes);
    }
  } catch (e) {
    // Bỏ qua lỗi nếu không tìm thấy user
  }

  // 3. Kiểm tra trong repository
  try {
    const repoData = await graphql(`
      query($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
          projectsV2(first: 20) {
            nodes {
              ${fieldsFragment}
            }
          }
        }
      }
    `, { owner: repoOwner, name: repoName });
    if (repoData?.repository?.projectsV2?.nodes) {
      candidates.push(...repoData.repository.projectsV2.nodes);
    }
  } catch (e) {
    // Bỏ qua lỗi repo
  }

  const project = candidates.find(p => p.title.trim().toLowerCase() === projectTitle.trim().toLowerCase());
  return project;
}

async function getAllIssues() {
  let allIssues = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const data = await graphql(`
      query($owner: String!, $repo: String!, $cursor: String) {
        repository(owner: $owner, name: $repo) {
          issues(first: 100, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              number
              title
              state
              body
              projectItems(first: 20) {
                nodes {
                  id
                  project {
                    id
                  }
                  fieldValueByName(name: "Status") {
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      name
                      optionId
                    }
                  }
                }
              }
            }
          }
        }
      }
    `, { owner: repoOwner, repo: repoName, cursor });

    const issueNodes = data?.repository?.issues?.nodes || [];
    allIssues.push(...issueNodes);

    hasNextPage = data?.repository?.issues?.pageInfo?.hasNextPage;
    cursor = data?.repository?.issues?.pageInfo?.endCursor;
  }

  return allIssues;
}

async function addIssueToProject(projectId, issueId) {
  const data = await graphql(`
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
        item {
          id
        }
      }
    }
  `, { projectId, contentId: issueId });
  return data?.addProjectV2ItemById?.item?.id;
}

async function updateItemStatus(projectId, itemId, fieldId, optionId) {
  const data = await graphql(`
    mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId,
        itemId: $itemId,
        fieldId: $fieldId,
        value: { singleSelectOptionId: $optionId }
      }) {
        projectV2Item {
          id
        }
      }
    }
  `, { projectId, itemId, fieldId, optionId });
  return data?.updateProjectV2ItemFieldValue?.projectV2Item?.id;
}

async function main() {
  console.log(`[INIT] Repository: ${repoOwner}/${repoName}`);
  console.log(`[INIT] Project Title: "${projectTitle}"`);

  // 1. Tìm Project
  const project = await findProjectV2();
  if (!project) {
    throw new Error(`[ERROR] Không tìm thấy GitHub Project V2 với tiêu đề: "${projectTitle}"`);
  }
  console.log(`[PROJECT] Tìm thấy Project: ${project.title} (ID: ${project.id})`);

  // 2. Tìm trường Status
  const statusField = project.fields.nodes.find(f => f.name === 'Status');
  if (!statusField) {
    throw new Error('[ERROR] Không tìm thấy trường "Status" trong Project V2');
  }

  const backlogOpt = statusField.options.find(o => o.name.toLowerCase() === 'backlog');
  const readyOpt = statusField.options.find(o => o.name.toLowerCase() === 'ready');

  if (!backlogOpt) throw new Error('[ERROR] Không tìm thấy option "Backlog" trong trường Status');
  if (!readyOpt) throw new Error('[ERROR] Không tìm thấy option "Ready" trong trường Status');

  console.log(`[STATUS] Field ID: ${statusField.id}`);
  console.log(`[STATUS] Option Backlog ID: ${backlogOpt.id}`);
  console.log(`[STATUS] Option Ready ID: ${readyOpt.id}`);

  // 3. Lấy toàn bộ Issues để tra cứu trạng thái và dependencies
  const allIssues = await getAllIssues();
  const issueStateMap = new Map();
  allIssues.forEach(iss => {
    issueStateMap.set(iss.number, iss.state);
  });

  const openIssues = allIssues.filter(iss => iss.state === 'OPEN');
  console.log(`[ISSUES] Tổng số issues: ${allIssues.length} | Đang OPEN: ${openIssues.length}`);

  const results = [];

  for (const issue of openIssues) {
    // Tìm Project item tương ứng
    let projectItem = issue.projectItems?.nodes?.find(item => item.project.id === project.id);
    let itemId = projectItem?.id;
    let currentStatus = projectItem?.fieldValueByName?.name || null;

    // Nếu chưa có trên bảng Project, thêm vào
    if (!itemId) {
      console.log(`[ADD] Thêm #${issue.number} "${issue.title}" vào bảng Project...`);
      itemId = await addIssueToProject(project.id, issue.id);
      currentStatus = null;
    }

    // Phân tích Blocked by
    const body = issue.body || '';
    const blockedByMatch = body.match(/\*{0,2}Blocked by[^*:]*\*{0,2}:\s*([^\r\n]+)/i);
    let isBlocked = false;
    let blockedText = 'Không có';
    let blockingNumbers = [];

    if (blockedByMatch) {
      blockedText = blockedByMatch[1].trim();
      const numbers = [...blockedText.matchAll(/#(\d+)/g)].map(m => parseInt(m[1], 10));
      blockingNumbers = numbers;

      if (blockedText.toLowerCase().includes('không có') || numbers.length === 0) {
        isBlocked = false;
      } else {
        const openBlockers = numbers.filter(n => issueStateMap.get(n) === 'OPEN');
        if (openBlockers.length > 0) {
          isBlocked = true;
        } else {
          isBlocked = false;
        }
      }
    } else {
      isBlocked = false;
    }

    // Xác định Status mới cần chuyển
    let newStatus = null;
    let newOptionId = null;

    if (isBlocked) {
      // Đang bị chặn: nếu không phải Backlog, chuyển về Backlog
      if (currentStatus !== 'Backlog') {
        newStatus = 'Backlog';
        newOptionId = backlogOpt.id;
      }
    } else {
      // Không bị chặn: nếu đang là Backlog hoặc null, chuyển sang Ready
      if (!currentStatus || currentStatus === 'Backlog') {
        newStatus = 'Ready';
        newOptionId = readyOpt.id;
      }
      // Nếu đang là In Progress, In Review, Testing, Done: giữ nguyên
    }

    let finalStatus = currentStatus;
    if (newStatus && newOptionId) {
      await updateItemStatus(project.id, itemId, statusField.id, newOptionId);
      console.log(`[SYNC] #${issue.number} ${issue.title}: ${currentStatus || '(none)'} -> ${newStatus}`);
      finalStatus = newStatus;
    } else {
      console.log(`[KEEP] #${issue.number} ${issue.title}: ${currentStatus || '(none)'} (Blocked: ${isBlocked})`);
    }

    results.push({
      number: issue.number,
      title: issue.title,
      blockedText,
      isBlocked,
      status: finalStatus || 'Backlog'
    });
  }

  console.log('\n======================================================');
  console.log('HOÀN TẤT ĐỒNG BỘ TRẠNG THÁI STATUS TRÊN GITHUB PROJECT');
  console.log('======================================================');
  results.sort((a, b) => a.number - b.number);
  return results;
}

main().catch(err => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
