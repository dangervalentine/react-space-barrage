---
name: Skip test activation during development
description: Tests are currently broken in the project; defer test activation to final step
type: feedback
---

Testing is deferred to the final cleanup phase. Don't attempt to fix, uncomment, or activate tests during implementation tasks. This allows development to proceed without being blocked by pre-existing test infrastructure issues. Test fixes will be handled as part of Task 9 (final testing & cleanup).

**Why:** Project has broken test setup that will be addressed holistically at the end, not per-task.

**How to apply:** During Tasks 1–8, focus on code implementation, compilation, and integration. Skip any test-related steps in implementation plans. Save all test work for final QA phase.
