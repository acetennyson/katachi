# Agent Instructions - Local Project Rules

## File Permissions
**CRITICAL**: Always create and modify files with permissions that allow the user to edit them.

After creating or modifying any file, immediately run:
```bash
chmod 666 <filename>
```

This ensures the user can edit files from their editor without permission issues.

## When Creating New Files
Always follow this pattern:
1. Create the file
2. Immediately run `chmod 666` on it
3. Continue with other operations

## Session Reminder
Read this file at the start of EVERY session to remember this rule.
