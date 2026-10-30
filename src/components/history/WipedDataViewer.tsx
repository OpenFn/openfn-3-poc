import Card from "../Card";
import Heading from "../Heading";
import TextLink from "../TextLink";
import Text from "../Text";
import Tooltip from "../Tooltip";

const labels = { input: "Input", output: "Output", request_response: "Request/Response" } as const;
const subjects = { input: "step", output: "step", request_response: "channel request" } as const;

/**
 * The dashed "No … Data here!" box for data wiped by the retention policy
 * (viewers.ex `wiped_data_viewer`).
 */
export default function WipedDataViewer({
  dataLabel,
  projectId,
  canEditDataRetention,
  adminContacts = [],
}: {
  dataLabel: keyof typeof labels;
  projectId: string;
  canEditDataRetention: boolean;
  adminContacts?: string[];
}) {
  return (
    <Card dashed padding="none" className="mb-4 px-8 pb-8 pt-6">
      <Text as="div" className="space-y-4 text-center text-muted">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-strong text-faint">
          <span className="hero-code-bracket h-4 w-4" />
        </div>
        <div>
          <Heading size="lg">No {labels[dataLabel]} Data here!</Heading>
          <p>
            {labels[dataLabel]} data for this {subjects[dataLabel]} has not been retained in accordance with your
            project's data storage policy.
          </p>
        </div>
        <p>
          {canEditDataRetention ? (
            <>
              {dataLabel === "request_response" ? "You can change " : "You can’t rerun this work order, but you can change "}
              <TextLink to={`/projects/${projectId}/settings#data-storage`}>this policy</TextLink> for future{" "}
              {dataLabel === "request_response" ? "requests" : "runs"}.
            </>
          ) : (
            <>
              Contact one of your{" "}
              <Tooltip content={adminContacts.join(", ")}>
                <span className="inline-block text-primary-400">project admins</span>
              </Tooltip>{" "}
              for more information.
            </>
          )}
        </p>
      </Text>
    </Card>
  );
}
