import Pill from "../primitives/Pill";

/**
 * The workflow version a run used (Common.snapshot_version_chip): "latest"
 * in primary, or an older snapshot's version number in yellow. The tooltip
 * is also the chip's label, as Lightning's Tooltip hook made it.
 */
export default function SnapshotVersionChip({ version, tooltip }: { version: string; tooltip: string }) {
  return version === "latest" ? (
    <Pill square color="primary" title={tooltip} aria-label={tooltip}>
      {version}
    </Pill>
  ) : (
    <Pill square tone="warning" title={tooltip} aria-label={tooltip}>
      {version}
    </Pill>
  );
}
