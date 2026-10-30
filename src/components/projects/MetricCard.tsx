import type { ReactNode } from "react";
import Card from "../primitives/Card";
import Heading from "../primitives/Heading";
import Text from "../primitives/Text";

/**
 * A stat tile (DashboardComponents.metric_card): a small title, a big
 * number, then a suffix line with an optional link.
 */
export default function MetricCard({
  title,
  value,
  suffix,
  link,
}: {
  title: string;
  value: ReactNode;
  suffix?: ReactNode;
  link?: ReactNode;
}) {
  return (
    <Card>
      <Heading as="h2" size="xs" className="truncate">
        {title}
      </Heading>
      <Text as="div" variant="stat-lg" className="mt-2">{value}</Text>{" "}
      {(suffix || link) && (
        <Text as="div" variant="body-sm" className="mt-1 flex items-baseline justify-between gap-2 text-muted">
          <div>{suffix}</div>
          {link}
        </Text>
      )}
    </Card>
  );
}
