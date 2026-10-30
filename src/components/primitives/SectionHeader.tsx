import type { ReactNode } from "react";
import Heading from "./Heading";
import Text from "./Text";

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned action, usually a Button. */
  action?: ReactNode;
  /** When set, shows "Role based permissions: You cannot modify this project's {section}". */
  permissionsSection?: string | undefined;
}

/**
 * A title, a small gray subtitle, an optional permissions warning, and the
 * section's main action on the right (Lightning's
 * `LayoutComponents.section_header`). `Card` uses it for its header.
 */
export default function SectionHeader({ title, subtitle, action, permissionsSection }: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Heading>{title}</Heading>
        {subtitle && <Text as="p" className="mt-1 text-muted">{subtitle}</Text>}
        {permissionsSection && (
          <Text as="p" className="mt-2 text-danger-700">
            Role based permissions: You cannot modify this project's {permissionsSection}
          </Text>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
