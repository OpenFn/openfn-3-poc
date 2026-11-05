import Button from "@/components/primitives/Button";
import Card from "@/components/primitives/Card";

/** The last card on /profile (profile_live/components.ex `delete_user_card`). */
export default function DeleteAccountCard({ to }: { to: string }) {
  return (
    <Card padding="lg"
      annotation="profile-delete-account"
      title="Delete account"
      description="Deleting your account is irreversible, and your credentials go with it."
      action={
        <Button tone="danger" to={to}>
          Delete my account
        </Button>
      }
    />
  );
}
