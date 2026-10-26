import { fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { renderPage } from "./renderPage";

function GoPage({ onGo }: { onGo: (n: number) => Promise<void> }) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState<number[]>([]);
  const go = () => {
    const n = count + 1;
    setCount(n);
    void onGo(n).then(() => setDone((d) => [...d, n]));
  };
  return (
    <>
      <button onClick={go}>Go</button>
      <p>done: {done.join(",")}</p>
    </>
  );
}

describe("renderPage", () => {
  it("answers the oldest call first, and refuses to answer when none is waiting", async () => {
    const host = renderPage(GoPage, {}, ["onGo"]);
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(host.calls("onGo")).toEqual([[1], [2]]);

    await host.resolve("onGo");
    expect(screen.getByText("done: 1")).toBeTruthy();
    await host.resolve("onGo");
    expect(screen.getByText("done: 1,2")).toBeTruthy();

    await expect(host.resolve("onGo")).rejects.toThrow("onGo has no call waiting for a reply");
  });
});
