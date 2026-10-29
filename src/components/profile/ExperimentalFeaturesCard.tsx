import Toggle from "../Toggle";
import Card from "../Card";
import { useToast } from "../Toast";
import { errorMessage } from "../../utils/errors";
import { useChosenValue } from "../../utils/useChosenValue";

interface Props {
  enabled: boolean;
  /** Saves on every flip. The switch shows the choice at once, and goes back with an error toast if this rejects. */
  onChange: (enabled: boolean) => Promise<void>;
}

/** The Experimental Features card on /profile (experimental_features_component.html.heex). */
export default function ExperimentalFeaturesCard({ enabled, onChange }: Props) {
  const toast = useToast();
  const chosen = useChosenValue(enabled, onChange, (e) => toast(errorMessage(e), "danger"));
  return (
    <Card
      padding="lg"
      annotation="profile-experimental-features"
      title={<span id="experimental-features-label">Experimental Features</span>}
      description="Enable access to new features and improvements before they're generally available"
      action={
        <Toggle
          id="preferences_experimental_features"
          checked={chosen.value}
          onChange={chosen.choose}
          labelledBy="experimental-features-label"
        />
      }
    />
  );
}
