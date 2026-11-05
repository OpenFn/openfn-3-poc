import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { apiTokens } from "@/mock-data/tokens";
import { renderPage } from "@/test/renderPage";
import { RequestError } from "@/utils/errors";
import TokensPage from "./TokensPage";

const render = (tokenId: string | null = null) => renderPage(TokensPage, { tokens: apiTokens, tokenId, isStepUpRequired: () => false, hasMfa: false }, ["onGenerate", "onDelete", "onClose", "onStepUp"]);
const generate = () => fireEvent.click(screen.getByRole("button", { name: "Generate new token" }));

describe("TokensPage", () => {
  it("shows a new token once it's generated, and says so", async () => {
    const host = render();
    generate();
    await host.resolve("onGenerate", "demo.fake-token-not-real.ABC");
    expect((screen.getByLabelText("New token") as HTMLInputElement).value).toBe("demo.fake-token-not-real.ABC");
    expect(screen.getByText("Token created successfully")).toBeTruthy();
  });

  it("toasts a failed generate and shows no banner", async () => {
    const host = render();
    generate();
    await host.reject("onGenerate", new RequestError("Lightning is down."));
    expect(screen.getByText("Lightning is down.")).toBeTruthy();
    expect(screen.queryByText("Token created successfully")).toBeNull();
    expect(screen.queryByLabelText("New token")).toBeNull();
  });

  it("says a token was deleted only once the delete succeeds", async () => {
    const host = render(apiTokens[0]!.id);
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(host.calls("onDelete")).toEqual([[apiTokens[0]!.id]]);
    expect(screen.queryByText("Token deleted successfully")).toBeNull();
    await host.resolve("onDelete");
    expect(screen.getByText("Token deleted successfully")).toBeTruthy();
  });

  it("asks for the password when the server wants it, then generates again", async () => {
    const refusal = new RequestError("Enter your password or an MFA code again to do this.");
    const host = renderPage(TokensPage, { tokens: apiTokens, tokenId: null, isStepUpRequired: (e) => e === refusal, hasMfa: false }, ["onGenerate", "onDelete", "onClose", "onStepUp"]);
    generate();
    await host.reject("onGenerate", refusal);
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: "my-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(host.calls("onStepUp")).toEqual([[{ password: "my-password" }]]);
    await host.resolve("onStepUp");
    expect(host.calls("onGenerate")).toHaveLength(2);
    await host.resolve("onGenerate", "demo.fake-token-not-real.XYZ");
    expect((screen.getByLabelText("New token") as HTMLInputElement).value).toBe("demo.fake-token-not-real.XYZ");
  });
});
