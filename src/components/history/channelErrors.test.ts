import { describe, expect, it } from "vitest";
import { humanizeError } from "./channelErrors";

describe("humanizeError", () => {
  it("explains every transport error", () => {
    expect(humanizeError("nxdomain")).toContain("DNS lookup failed");
    expect(humanizeError("econnrefused")).toContain("Connection refused");
    expect(humanizeError("ehostunreach")).toContain("Host unreachable");
    expect(humanizeError("enetunreach")).toContain("Network unreachable");
    expect(humanizeError("closed")).toContain("Connection closed unexpectedly");
    expect(humanizeError("econnreset")).toContain("Connection reset");
    expect(humanizeError("econnaborted")).toContain("Connection aborted");
    expect(humanizeError("epipe")).toContain("Broken pipe");
    expect(humanizeError("connect_timeout")).toContain("Connection timed out");
    expect(humanizeError("response_timeout")).toContain("Response timed out");
    expect(humanizeError("timeout")).toContain("Request timed out");
  });

  it("explains every credential error, including an unsupported schema by name", () => {
    expect(humanizeError("credential_missing_auth_fields")).toContain("missing required authentication fields");
    expect(humanizeError("credential_environment_not_found")).toContain("credential environment could not be found");
    expect(humanizeError("oauth_refresh_failed")).toContain("OAuth token refresh failed");
    expect(humanizeError("oauth_reauthorization_required")).toContain("OAuth credential needs to be re-authorized");
    const unsupported = humanizeError("unsupported_credential_schema:my_schema");
    expect(unsupported).toContain("Unsupported credential type");
    expect(unsupported).toContain("my_schema");
  });

  it("passes an unknown code through unchanged", () => {
    expect(humanizeError("some_unknown_error")).toBe("some_unknown_error");
  });
});
