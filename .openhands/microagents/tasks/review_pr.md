---
name: review_pr
type: task
version: 1.0.0
agent: CodeActAgent
author: D3Serve Dev Team (by OpenHands)
triggers:
  - review pr
  - review pull request
  - pr review
  - code review
inputs:
  - name: PR_NUMBER
    description: 'The number of the pull request to review (e.g., 158)'
    required: true
---

# PR Review Task

This task guides you through reviewing pull requests in namefi-astra according to project standards.

## Review Guidelines

1. **Understand Changes**:
   - Review the PR description and linked issues
   - Check the files changed tab for scope

2. **Code Quality**:
   - Verify changes follow `.coderabbit.yaml` rules
   - Check for proper error handling
   - Ensure consistent formatting

3. **Documentation**:
   - Verify README/docstring updates
   - Check for new configuration needs

4. **Testing**:
   - Confirm adequate test coverage
   - Verify tests pass

## Suggestion Format

Use GitHub's suggestion syntax:
```suggestion
// Suggested improvement
function improvedCode() {
  return betterResults;
}
```

## Completion Steps

1. Add review comments
2. Request changes or approve
3. Summarize key points

## Reference Documents
- `.coderabbit.yaml` for review standards
- Project style guides
- API documentation