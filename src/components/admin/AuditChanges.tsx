import type { AuditEvent, AuditValue } from "@/types/admin";
import Card from "@/components/primitives/Card";
import { Stack } from "@/components/primitives/Stack";
import { Td } from "@/components/primitives/Table";
import Text from "@/components/primitives/Text";

/** Values print as Lightning's HEEx prints them: `true` as "true", nil as "". */
const show = (value: AuditValue) => (value === null ? "" : String(value));

/**
 * The change strip under each audit row (AuditLive.Index `diff`): every
 * changed field as `field old → new` (old struck through), or
 * "No changes". Renders a full-width <td>.
 */
export default function AuditChanges({ audit }: { audit: AuditEvent }) {
  const before = audit.changes.before ?? {};
  const after = audit.changes.after ?? {};
  const changes = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .sort()
    .map((key) => ({ key, old: before[key] ?? null, next: after[key] ?? null }));

  if (changes.length === 0) {
    return (
      // eslint-disable-next-line local/primitive-classname -- debt: box (p-6!)
      <Td colSpan={4} className="p-6! break-all">
        <Text as="div" variant="code-sm">
          No changes
        </Text>
      </Td>
    );
  }

  return (
    // eslint-disable-next-line local/primitive-classname -- debt: box (p-4!)
    <Td colSpan={4} className="p-4! break-all">
      <Text as="div" variant="code-sm">
        <Card variant="muted" padding="sm">
          <Stack as="ul" gap="sm">
            {changes.map(({ key, old, next }) => (
              <li key={key}>
                <span className="font-semibold">{key}</span>&nbsp;{" "}
                {old !== null && (
                  <>
                    <span className="text-muted line-through">{show(old)}</span>{" "}
                    <span className="hero-arrow-right mx-2 h-4 w-4 text-faint" />{" "}
                  </>
                )}
                <span className="text-strong">{show(next)}</span>
              </li>
            ))}
          </Stack>
        </Card>
      </Text>
    </Td>
  );
}
