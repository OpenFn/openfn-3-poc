import DateTime from "../primitives/DateTime";
import Heading from "../primitives/Heading";
import type { ProfileDetail } from "../../types/profile";

/** Left column of /profile (profile_live/components.ex `user_info`). */
export default function UserInfo({ user }: { user: ProfileDetail }) {
  return (
    // eslint-disable-next-line no-restricted-syntax -- debt: 14px copy on a 24px line (text-sm leading-6) has no Text style
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
