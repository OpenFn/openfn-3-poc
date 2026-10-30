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
      {/* eslint-disable-next-line no-restricted-syntax -- debt: 30px stat number has no Text style */}
      <div className="mt-2 text-3xl font-bold">{value}</div>{" "}
      {(suffix || link) && (
        <Text as="div" variant="body-sm" className="mt-1 flex items-baseline justify-between gap-2 text-muted">
          <div>{suffix}</div>
          {link}
        </Text>
      )}
    </Card>
  );
}
