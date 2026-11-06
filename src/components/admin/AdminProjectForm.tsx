import { useState } from "react";
import { projectRoleOptions } from "@/constants";
import type { AdminProjectFormValues, AdminProjectUser } from "@/types/admin";
import type { ProjectRole } from "@/types/projects";
import type { ResourceStatus } from "@/types/resource";
import { RequestError } from "@/utils/errors";
import { fullName, urlSafeName } from "@/utils/format";
import { matchesQuery } from "@/utils/search";
import { useForm } from "@/utils/useForm";
import { blank } from "@/utils/validate";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import FormModal from "@/components/primitives/FormModal";
import { Field, Select, TextArea } from "@/components/primitives/Inputs";
import NameField from "@/components/primitives/NameField";
import SearchInput from "@/components/primitives/SearchInput";
import { Table, Td, Th, Tr } from "@/components/primitives/Table";
import Text from "@/components/primitives/Text";

interface Props {
  /** Who can be given a role. */
  users: AdminProjectUser[];
  /** Where loading `users` stands. Left out, they are ready. */
  status?: ResourceStatus | undefined;
  onCancel: () => void;
  /** Creates the project, with the URL-safe name. Rejects with a message, or a 422's field errors keyed as the API keys them (`name`, `description`, `members`, `members.0.email`). */
  onSave: (values: AdminProjectFormValues) => Promise<void>;
}

/**
 * A 422's errors go on the form: one about a single member (`members.2.email`)
 * goes under Members, with that member's email in front. Any other refusal
 * (a plan limit's entry at `#/members`) is a message for the whole form.
 */
function onTheForm(error: unknown, members: AdminProjectFormValues["members"]): unknown {
  if (!(error instanceof RequestError) || !error.hasFieldErrors) return error;
  if (error.status !== undefined && error.status !== 422) return new RequestError(error.message);
  const fieldErrors: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(error.fieldErrors)) {
    const [field = key, index] = key.split(".");
    const email = index === undefined ? undefined : members[Number(index)]?.email;
    (fieldErrors[field] ??= []).push(...messages.map((m) => (email ? `${email} ${m}` : m)));
  }
  return new RequestError(error.message, { fieldErrors });
}

/**
 * The superuser's New project modal (project_live/form_component.html.heex):
 * a name, with the URL-safe name it will get, a description, and a role for
 * each person. The client checks only that there's a name and an owner; the
 * server checks the rest. Filtering the people keeps every role already given.
 */
export default function AdminProjectForm({ users, status = { state: "ready" }, onCancel, onSave }: Props) {
  const form = useForm<AdminProjectFormValues>({
    initial: { name: "", description: "", members: [] },
    validate: ({ name, members }) => ({
      name: blank(urlSafeName(name)),
      members: members.some((m) => m.role === "owner") ? [] : ["Every project must have exactly one owner."],
    }),
  });
  const [filter, setFilter] = useState("");
  const { members } = form.values;
  const roleOf = (email: string) => members.find((m) => m.email === email)?.role ?? "";
  const setRole = (email: string, role: string) => {
    const others = members.filter((m) => m.email !== email);
    form.set("members", role ? [...others, { email, role: role as ProjectRole }] : others);
  };
  const shown = users.filter((u) => matchesQuery(filter, fullName(u), u.email));

  return (
    <FormModal
      open
      onClose={onCancel}
      size="2xl"
      title="New project"
      formId="project-form"
      submitLabel="Create project"
      errorHeader="The project wasn't saved"
      submitDisabled={status.state !== "ready"}
      onSubmit={form.modalSubmit(async (values) => {
        try {
          await onSave({ ...values, name: urlSafeName(values.name), description: values.description.trim() });
        } catch (error) {
          throw onTheForm(error, values.members);
        }
      })}
    >
      <AsyncBoundary status={status}>
        <NameField id="project_raw_name" required {...form.fieldProps("name")} badgeLabel="Note that this project will be named:" />
        <TextArea id="project_description" label="Description" rows={2} {...form.fieldProps("description")} />
        <Field group label="Members" hint="Give each person a role in this project. Exactly one of them is its owner." errors={form.errors.members}>
          <SearchInput value={filter} onChange={setFilter} placeholder="Filter users" />
          <Table
            id="project_users_table"
            header={
              <Tr>
                <Th>Name</Th>
                <Th align="right">Role</Th>
              </Tr>
            }
          >
            {shown.length === 0 ? (
              <Tr>
                <Td colSpan={2}>No users match.</Td>
              </Tr>
            ) : (
              shown.map((user) => (
                <Tr key={user.id}>
                  <Td>
                    <Text as="div" tone={roleOf(user.email) ? "strong" : "muted"}>
                      {fullName(user)}
                    </Text>
                    <Text as="div" variant="body-sm">
                      {user.email}
                    </Text>
                  </Td>
                  <Td align="right">
                    <Select
                      aria-label={`${fullName(user)}'s role`}
                      options={projectRoleOptions}
                      value={roleOf(user.email)}
                      onChange={(e) => setRole(user.email, e.target.value)}
                    />
                  </Td>
                </Tr>
              ))
            )}
          </Table>
        </Field>
      </AsyncBoundary>
    </FormModal>
  );
}
