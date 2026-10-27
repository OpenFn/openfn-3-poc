import DateTime from "../DateTime";
import Heading from "../Heading";
import type { ProfileDetail } from "../../types/profile";

/** Left column of /profile (profile_live/components.ex `user_info`). */
export default function UserInfo({ user }: { user: ProfileDetail }) {
  return (
    <div className="space-y-1 text-sm leading-6 text-muted">
      <Heading as="h2">
        {user.firstName} {user.lastName}
      </Heading>
      <p>Change name, email, password, and request deletion.</p>
      <hr className="my-6 border-subtle" />
      <p>
        Created: <DateTime value={user.insertedAt} />
      </p>
      <p>Email: {user.email}</p>
    </div>
  );
}
