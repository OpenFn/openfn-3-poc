import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FileDropZone from "./FileDropZone";

describe("FileDropZone", () => {
  it("takes a picked or dropped file, and says so when a dropped file is the wrong type", () => {
    const onFile = vi.fn();
    render(
      <FileDropZone
        accept=".yaml,.yml"
        label="Upload or drop a YAML file."
        invalidMessage="File must be .yml or .yaml format"
        onFile={onFile}
      />
    );
    const input = screen.getByLabelText("Upload or drop a YAML file.");
    const zone = input.closest("label")!;

    const picked = new File(["name: a"], "picked.yaml");
    fireEvent.change(input, { target: { files: [picked] } });
    expect(onFile).toHaveBeenLastCalledWith(picked);

    const dropped = new File(["name: b"], "dropped.YML");
    fireEvent.drop(zone, { dataTransfer: { files: [dropped] } });
    expect(onFile).toHaveBeenLastCalledWith(dropped);

    fireEvent.drop(zone, { dataTransfer: { files: [new File(["{}"], "input.json")] } });
    expect(onFile).toHaveBeenCalledTimes(2);
    expect(screen.getByText("File must be .yml or .yaml format")).toBeTruthy();
  });

  it("turns away a file over 8MB, and several files dropped at once", () => {
    const onFile = vi.fn();
    render(<FileDropZone accept=".json" label="Upload a file or drag and drop" invalidMessage="Wrong type" onFile={onFile} />);
    const zone = screen.getByLabelText("Upload a file or drag and drop").closest("label")!;

    const big = new File(["{}"], "big.json");
    Object.defineProperty(big, "size", { value: 9 * 1024 * 1024 });
    fireEvent.drop(zone, { dataTransfer: { files: [big] } });
    expect(screen.getByText("File size 9.0MB exceeds maximum of 8MB")).toBeTruthy();

    fireEvent.drop(zone, { dataTransfer: { files: [new File(["{}"], "a.json"), new File(["{}"], "b.json")] } });
    expect(screen.getByText("Only 1 file can be uploaded")).toBeTruthy();
    expect(onFile).not.toHaveBeenCalled();
  });
});
