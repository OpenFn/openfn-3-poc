import { useState } from "react";
import Button from "../primitives/Button";
import ConfirmModal from "../primitives/ConfirmModal";
import Card from "../primitives/Card";
import type { GithubAccessSettings } from "../../types/profile";

interface Props {
  github: GithubAccessSettings;
  onDisconnect: () => Promise<void>;
}

/** The GitHub Access card on /profile (profile_live/github_component.ex). */
export default function GithubCard({ github, onDisconnect }: Props) {
  const [confirming, setConfirming] = useState(false);
  const { connectHref, status } = github;
  return (
    <Card
      padding="lg"
      annotation="profile-github"
      title={<span id="github_section-label">GitHub Access</span>}
      description={
        <span id="github_section-description">
          Linking your OpenFn account to your GitHub account allows you to manage version control across your projects.
        </span>
      }
      action={
        connectHref === null ? (
          <Button id="github-oauth-not-enabled" disabled tooltip="GitHub OAuth has not been enabled for this instance.">
            Connect your GitHub account
          </Button>
        ) : status === "connected" ? (
          <Button id="disconnect-github-button" tone="danger" onClick={() => setConfirming(true)}>
            Disconnect from GitHub
          </Button>
        ) : (
          <Button
            id="connect-github-link"
            href={connectHref}
            target="_blank"
            tooltip={status === "expired" ? "Your token has expired" : undefined}
          >
            {status === "expired" ? "Reconnect" : "Connect"} your GitHub Account
          </Button>
        )
      }
    >
      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Disconnect from GitHub?"
        tone="danger"
        confirmLabel="Disconnect"
        confirmId="disconnect_github_modal_confirm_button"
        onConfirm={async () => {
          await onDisconnect();
          setConfirming(false);
        }}
      >
        <p>
          You are about to disconnect your OpenFn account from GitHub. Until you reconnect, you will not be able to set
          up or modify version control for your projects.
        </p>
      </ConfirmModal>
    </Card>
  );
}
