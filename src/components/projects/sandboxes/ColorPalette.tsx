import { sandboxColorPalette } from "../../../constants";
import { Field } from "../../primitives/Inputs";

/**
 * The sandbox colour picker (SandboxLive.Components.color_palette): a grid
 * of 16 swatches; the selected one shows a white check. null ticks none, on
 * purpose: Lightning ticks the first swatch, so saving an edit gives a sandbox
 * with no colour that swatch without the user choosing it. Here it stays null.
 */
export default function ColorPalette({
  value,
  onChange,
  label = "Color",
  palette = sandboxColorPalette,
  disabled = false,
}: {
  value: string | null;
  onChange: (hex: string) => void;
  label?: string;
  palette?: string[];
  disabled?: boolean;
}) {
  const current = value;
  return (
    <Field group label={label} aria-label="Choose a color for your sandbox" disabled={disabled}>
      <div className="grid w-fit select-none grid-cols-4 gap-0.5 sm:grid-cols-8">
        {palette.map((hex) => (
          // The radio is hidden, so the swatch shows its keyboard focus.
          <label
            key={hex}
            className="relative cursor-pointer rounded-xs transition-transform hover:z-10 hover:scale-102 has-focus-visible:z-10 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
          >
            {/* eslint-disable-next-line no-restricted-syntax -- a swatch is the control here, so the radio itself is visually hidden */}
            <input
              type="radio"
              name="color"
              value={hex}
              checked={hex === current}
              onChange={() => onChange(hex)}
              aria-label={hex}
              className="sr-only"
            />
            <span className="flex h-12 w-12 items-center justify-center rounded-xs md:h-14 md:w-14" style={{ backgroundColor: hex }} aria-hidden="true">
              {hex === current && <span className="hero-check h-6 w-6 text-inverse drop-shadow-lg" />}
            </span>
          </label>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        Selected: {current ?? "none"}
      </p>
    </Field>
  );
}
