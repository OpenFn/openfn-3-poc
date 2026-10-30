import Tabs from "../primitives/Tabs";

/** The Work Orders / Channel Logs tabs beside History's title (run_live/index.html.heex). */
export default function HistoryTabs({
  active,
  workOrdersHref,
  channelLogsHref,
}: {
  active: "work-orders" | "channel-logs";
  workOrdersHref: string;
  channelLogsHref: string;
}) {
  return (
    <Tabs
      variant="pill"
      label="History"
      active={active}
      tabs={[
        { id: "work-orders", label: "Work Orders", to: workOrdersHref },
        { id: "channel-logs", label: "Channel Logs", to: channelLogsHref },
      ]}
    />
  );
}
