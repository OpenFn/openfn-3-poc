import FormModal from "@/components/primitives/FormModal";
import { TextArea } from "@/components/primitives/Inputs";
import NameField from "@/components/primitives/NameField";
import Text from "@/components/primitives/Text";
import { urlSafeName } from "@/utils/format";
import { useForm } from "@/utils/useForm";
import { blank } from "@/utils/validate";
import { Stack } from "@/components/primitives/Stack";

/**
 * "Create a new project" (DashboardLive.ProjectCreationModal): Name, with
 * the URL-safe name it will get, and an optional Description. Create with
 * an invalid name shows its error instead of submitting. The fields are named
 * as the API names them, so server field errors (`name`, `description`)
 * show on their fields. `name` holds the name as typed until it's sent.
 */
export default function CreateProjectModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate?: (project: { name: string; description: string }) => Promise<void>;
}) {
  const form = useForm({
    initial: { name: "", description: "" },
    validate: ({ name, description }) => ({
      name: blank(urlSafeName(name)),
      description: description.length > 240 ? ["should be at most 240 character(s)"] : [],
    }),
  });

  const close = () => {
    form.reset();
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={close}
      title="Create a new project"
      size="md"
      formId="project-form"
      onSubmit={form.modalSubmit(async ({ name, description }) => {
        await onCreate?.({ name: urlSafeName(name), description });
        close();
      })}
      submitLabel="Create project"
      cancelId="cancel-project-creation"
    >
      <NameField
        id="project_raw_name"
        required
        {...form.fieldProps("name")}
        badgeLabel="Your project will be named"
      />
      <Stack gap="sm">
        <TextArea id="project_description" label="Description" {...form.fieldProps("description")} />
        <Text as="p" variant="body-sm" tone="muted">
          A short description of a project [max 240 characters]
        </Text>
      </Stack>
    </FormModal>
  );
}
