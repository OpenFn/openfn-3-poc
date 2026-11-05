# API gaps: what Brandon's design shows that api/ doesn't have

One entry per thing Brandon's ia-demo design shows that no route in
`api/` (planned scope included) can give. Each says where it shows, what it
would need, and what the replica does until then (usually: leaves it out).
The replica's pages map a gap to "none"; they never fake it.

## Workflows list (ia-demo `ProjectWorkflowsPage`, `WorkflowRow`)

- **Members: who edited each workflow, most recent first** (an avatar stack).
  `api/workflows.md` has no editors on a workflow; the only record of who
  changed what is audit events, which aren't on the list route. Would need
  something like `editors` (user ids or names, newest first) on each workflow,
  perhaps under `include=stats`. Replica: column left out.
- **Service status (Live / Draft)** on a workflow that backs a service. There
  are no services in the API at all; in ia-demo it sits behind the
  `serviceCatalog` flag. Replica: left out.
