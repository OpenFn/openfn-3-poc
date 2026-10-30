import Alert from "../primitives/Alert";
import Button from "../primitives/Button";
import { TextArea, TextInput } from "../primitives/Inputs";
import SectionHeader from "../primitives/SectionHeader";
import NameField from "../primitives/NameField";
import TextLink from "../primitives/TextLink";
import Toggle from "../primitives/Toggle";
import SandboxSettingsBanner from "./SandboxSettingsBanner";
import Card from "../primitives/Card";
import type { ParentProjectRef, ProjectIdentityValues, SetupSettings } from "../../types/project-settings";
import { errorMessage } from "../../utils/errors";
import { urlSafeName } from "../../utils/format";
import { useForm } from "../../utils/useForm";
import { blank } from "../../utils/validate";

interface Props {
  setup: SetupSettings;
  /** The parent, when the project is a sandbox. */
  parent: ParentProjectRef | null;
  /** Saves Project Identity. Rejects with field errors (`rawName`) or a message, which the form shows inline. */
  onSaveIdentity: (values: ProjectIdentityValues) => Promise<void>;
  /** Saves Concurrency Override: 1 for one run at a time, null for parallel. */
  onSaveConcurrency: (concurrency: number | null) => Promise<void>;
}

/**
 * The Setup tab (`#project`, settings.html.heex:67-313): Project Identity
 * form, Concurrency Override, Export, and the danger zone. As in Lightning,
 * Identity's Save is enabled whenever the user can edit; Concurrency's waits
 * for a change.
 */
export default function ProjectSetupPanel({ setup, parent, onSaveIdentity, onSaveConcurrency }: Props) {
  const { canEditProject, canDeleteProject } = setup;
  const sandbox = parent !== null;
  const identity = useForm<ProjectIdentityValues>({
    initial: { rawName: setup.name, description: setup.description },
    validate: ({ rawName }) => ({ rawName: blank(urlSafeName(rawName)) }),
  });
  const concurrency = useForm({ initial: { serial: setup.concurrency === 1 } });

  return (
    <>
      <SectionHeader
        size="lg"
        title={sandbox ? "Sandbox setup" : "Project setup"}
        subtitle={
          sandbox
            ? "Sandboxes are isolated copies of a project for safe experimentation."
            : "Projects are isolated workspaces that contain workflows, accessible to certain users."
        }
        permissionsSection={canEditProject ? undefined : "basic settings, but you can export a copy."}
      />
      {sandbox && <SandboxSettingsBanner scope="local" />}
      <Card
        title={sandbox ? "Sandbox Identity" : "Project Identity"}
        description={
          parent ? (
            <>
              Identifies this sandbox within its parent: <TextLink to={parent.settingsHref}>{parent.name}</TextLink>
            </>
          ) : (
            "This metadata helps you identify the types of workflows managed in this project and the people that have access."
          )
        }
      >
        <form id="project-settings-form" className="space-y-4" onSubmit={identity.submit(onSaveIdentity)}>
          <NameField
            id="project-settings-form_raw_name"
            label="Project name"
            disabled={!canEditProject}
            {...identity.fieldProps("rawName")}
            badgeLabel="Your project will be named"
          />
          <TextInput
            id="project-settings-form_env"
            label="Project environment"
            hint="Credentials will be loaded with values from this environment."
            value={setup.env}
            disabled
            readOnly
          />
          <TextArea
            id="project-settings-form_description"
            label="Project description"
            hint="A short description of a project (max 240 characters)"
            disabled={!canEditProject}
            maxLength={240}
            {...identity.fieldProps("description")}
          />
          {identity.error && <Alert tone="danger">{errorMessage(identity.error)}</Alert>}
          <Button
            id="project-identity-submit-btn"
            type="submit"
            disabled={!canEditProject}
            pending={identity.pending}
          >
            Save
          </Button>
        </form>
      </Card>

      <Card
        title="Concurrency Override"
        description={
          <span className="block space-y-2">
            <span className="block">
              By default, runs are executed concurrently in accordance to limits set on individual workflows. In some
              situations, you may want to prevent concurrent execution across all workflows in a project.
            </span>
            <span className="block">
              Disabling parallel run execution ensures that only one run is executed at a time, regardless of
              workflow, for this entire project.
            </span>
          </span>
        }
      >
        <form
          id="project-concurrency-form"
          className="space-y-4"
          onSubmit={concurrency.submit(({ serial }) => onSaveConcurrency(serial ? 1 : null))}
        >
          <Toggle
            id="project-concurrency-switch"
            checked={concurrency.values.serial}
            onChange={(serial) => concurrency.set("serial", serial)}
            disabled={!canEditProject}
            label="Disable parallel execution"
            note="(No more than one run at a time)"
          />
          {concurrency.values.serial && concurrency.dirty && (
            <Alert tone="warning" header="Heads Up!">
              <p>Disabling parallel run execution may significantly reduce the overall throughput of your project.</p>
            </Alert>
          )}
          {concurrency.error && <Alert tone="danger">{errorMessage(concurrency.error)}</Alert>}
          <Button
            id="project-concurrency-submit-btn"
            type="submit"
            disabled={!(concurrency.dirty && canEditProject)}
            pending={concurrency.pending}
          >
            Save
          </Button>
        </form>
      </Card>

      <Card
        title="Export your Project"
        description="Export your project as code, to save this version or edit your project locally."
      >
        <Button href={setup.exportHref} target="_blank">
          Export project
        </Button>
      </Card>

      {canDeleteProject && (
        <Card
          title="The danger zone"
          description={
            sandbox
              ? "Deleting this sandbox is irreversible. It removes every workflow, trigger, version, keychain clone, and dataclip that lives only inside it."
              : "Deleting your project is irreversible"
          }
        >
          <Button tone="danger" to={setup.deleteHref}>
            {sandbox ? "Delete sandbox" : "Delete project"}
          </Button>
        </Card>
      )}
    </>
  );
}
