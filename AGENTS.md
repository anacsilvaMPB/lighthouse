# Agent rules

- Before changing behaviour, write a failing test first.
- Before saying a change is done, run all of: `npm test`, `npm run lint`, and the type check (`npm run build`, which runs `tsc` as part of the Next.js build).
- If any of those checks fail, do not push.
- Commit after each small change, rather than batching unrelated work into one commit.
- Ask before adding a new library/dependency.
- Before pushing, run the app locally (`npm run dev`) and wait for confirmation that it looks right.
