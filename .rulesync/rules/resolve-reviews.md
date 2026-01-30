---
targets:
  - '*'
root: false
description: Trigger when the user asks to "resolve reviews" or "resolve code reviews"
globs: []
cursor:
  alwaysApply: false
  description: Trigger when the user asks to "resolve reviews" or "resolve code reviews"
---
# Resolve Code Reviews

When asked to "resolve reviews" or "resolve code reviews", follow this workflow:

## 1. Get Current Branch's PR Number

First, identify the PR number for the current branch. You can use:
- `gh pr view --json number` to get the PR number for the current branch
- Or check the branch name and find the associated PR

## 2. Fetch Unresolved Review Threads

Run the following GitHub GraphQL query to get all unresolved review threads:

```bash
gh api graphql -F owner=':owner' -F name=':repo' -F number=<PR_number> -f query='
  query($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        reviewThreads(last: 100) {
          nodes {
            isResolved
            path
            comments(first: 1) {
              nodes {
                author { login }
                body
                createdAt
              }
            }
          }
        }
      }
    }
  }
' --jq '.data.repository.pullRequest.reviewThreads.nodes | map(select(.isResolved == false))'
```

**Note**: Replace `:owner` and `:repo` with the actual repository owner and name. You may need to extract these from the git remote URL or ask the user if not clear.

## 3. Process Each Review

For each unresolved review thread:

1. **Assess if it's reasonable**:
   - Read the review comment carefully
   - Understand the context by examining the file and line mentioned
   - Determine if the feedback is valid and should be addressed

2. **If reasonable, fix it**:
   - Make the necessary code changes
   - Ensure the fix addresses the reviewer's concern
   - Update the relevant files

3. **Document the plan**:
   - Create a clear plan showing:
     - Which reviews are being addressed
     - What changes will be made for each
     - Which reviews (if any) are being deferred or require discussion

## 4. Wait for User Review

After creating the plan and making fixes:
- Present the plan to the user
- Show what changes were made
- Wait for the user's approval before proceeding with any commits or further actions
- If any reviews require discussion or clarification, present them separately for the user's input

## 5. Commit, Update Stack, and Resolve Reviews

After receiving user approval:

1. **Commit the changes**:
   - Use `gt modify -a --no-edit` to amend the current commit with the fixes (this automatically restacks any dependent branches)
   - Or use `gt create <branch-name> -m "..." --all --no-interactive` if creating a new commit
   - Follow the project's conventional commit style

2. **Update the Graphite stack**:
   - Run `gt submit --stack --no-interactive` to push updates to all affected PRs in the stack

3. **Resolve all review threads**:

   **For reviews that were fixed:**
   ```bash
   gh api graphql -f query='
     mutation {
       resolveReviewThread(input: {threadId: "<THREAD_ID>"}) {
         thread { isResolved }
       }
     }
   '
   ```

   **For reviews that were declined/deferred:**
   - First, add a response comment explaining the rationale:
   ```bash
   gh api graphql -f query='
     mutation {
       addPullRequestReviewThreadReply(input: {
         pullRequestReviewThreadId: "<THREAD_ID>",
         body: "<RATIONALE_MESSAGE>"
       }) {
         comment { id }
       }
     }
   '
   ```
   - Then resolve the thread using the same `resolveReviewThread` mutation above
   - Example rationale: "Deferring this enhancement - would require significant refactoring for the current use case. Backend validation still catches invalid inputs."

4. **Verify all threads are resolved**:
   - Re-run the fetch query from Step 2 to confirm no unresolved threads remain

## Important Notes

- Always verify the repository owner and name before running the GraphQL query
- If the PR number cannot be determined automatically, ask the user
- Be thorough in understanding each review comment before making changes
- If a review seems unclear or requires clarification, flag it for the user rather than guessing
- Remember to request approval for git operations as per user rules before executing step 5
