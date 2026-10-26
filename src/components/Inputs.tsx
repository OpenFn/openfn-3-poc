import { Label as HeadlessLabel, Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { useId, useRef, useState, type FocusEvent, type InputHTMLAttributes, type ReactNode, type Ref, type TextareaHTMLAttributes } from "react";
import { cn } from "../utils/cn";
import { controlClasses } from "./controlClasses";
import { floatingPanelClasses } from "./floating";
import IconButton from "./IconButton";

/**
 * Form controls. Every control shares one look (`controlClasses`) and sits
 * in a `Field`, which handles the label, hint and errors. Wrap a custom
 * control in `Field` to give it the same frame, and give the control
 * `data-ui="field"` so themes style it like the others.
 */

export function Label({ htmlFor, className, children }: { htmlFor?: string | undefined; className?: string | undefined; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} data-ui="label" className={cn("text-sm/6 font-medium text-gray-800", className)}>
      {children}
    </label>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p data-tag="error_message" data-ui="error-message" className="mt-1 inline-flex items-center gap-x-1.5 text-xs text-danger-600">
      <span className="hero-exclamation-circle h-4 w-4" />
      {children}
    </p>
  );
}

interface FieldProps {
  label?: ReactNode;
  required?: boolean | undefined;
  /** Help text between the label and the control. */
  hint?: ReactNode;
  errors?: string[];
  /** Classes for the field wrapper (label + control + errors), e.g. `flex-1` to grow in a flex row. `className` styles the control itself. */
  fieldClassName?: string | undefined;
}

/** The control's id, or a generated one, so its label is always linked to it. */
function useFieldId(id?: string) {
  const generated = useId();
  return id ?? generated;
}

/** A label, optional hint, a control and its errors. */
export function Field({ id, label, required, hint, errors = [], className, children }: Omit<FieldProps, "fieldClassName"> & { id?: string | undefined; className?: string | undefined; children: ReactNode }) {
  return (
    <div className={className} data-ui="form-group" data-invalid={errors.length > 0 || undefined}>
      {label && (
        <Label htmlFor={id} className="mb-2 block">
          {label}
          {required && <span data-ui="required" className="text-red-500"> *</span>}
        </Label>
      )}
      {hint && <small data-ui="hint" className="mb-2 block text-xs text-gray-600">{hint}</small>}
      {children}
      {errors.map((e) => (
        <FieldError key={e}>{e}</FieldError>
      ))}
    </div>
  );
}

export function TextInput({ label, required, hint, errors = [], fieldClassName, className, ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useFieldId(rest.id);
  return (
    <Field id={id} label={label} required={required} hint={hint} errors={errors} className={fieldClassName}>
      <input type="text" autoComplete="off" required={required} data-ui="field" className={controlClasses(errors.length > 0, className)} {...rest} id={id} />
    </Field>
  );
}

/**
 * Lightning's password `.input` (new_inputs.ex): a text field with an eye
 * button that toggles between hidden and shown.
 */
export function PasswordInput({ label, required, hint, errors = [], fieldClassName, className, ...rest }: FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const id = useFieldId(rest.id);
  const [revealed, setRevealed] = useState(false);
  return (
    <Field id={id} label={label} required={required} hint={hint} errors={errors} className={fieldClassName}>
      <div className="relative">
        <input
          type={revealed ? "text" : "password"}
          required={required}
          data-ui="field"
          className={controlClasses(errors.length > 0, cn("pr-10", className))}
          {...rest}
          id={id}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          <IconButton
            icon={revealed ? "hero-eye" : "hero-eye-slash"}
            label={revealed ? "Hide password" : "Show password"}
            onClick={() => setRevealed((r) => !r)}
          />
        </div>
      </div>
    </Field>
  );
}

export function TextArea({ label, required, hint, errors = [], fieldClassName, className, ...rest }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useFieldId(rest.id);
  return (
    <Field id={id} label={label} required={required} hint={hint} errors={errors} className={fieldClassName}>
      <textarea required={required} data-ui="field" className={controlClasses(errors.length > 0, cn("overflow-y-auto", className))} {...rest} id={id} />
    </Field>
  );
}

/** An option as a plain string, a `[label, value]` pair or an object. */
export type SelectOption = string | [label: string, value: string] | { label: string; value: string };

function optionParts(o: SelectOption): [string, string] {
  if (typeof o === "string") return [o, o];
  if (Array.isArray(o)) return o;
  return [o.label, o.value];
}

interface SelectProps extends FieldProps {
  id?: string | undefined;
  /** Adds a hidden input with this name, for a plain form post. */
  name?: string | undefined;
  /** The chosen value. */
  value: string;
  options: SelectOption[];
  /** Shown while the value matches no option. It isn't an option itself. */
  prompt?: string | undefined;
  disabled?: boolean | undefined;
  /** Shaped like a select's change event, so handlers read `e.target.value`. */
  onChange?: (e: { target: { value: string } }) => void;
  /** Runs when focus leaves the control, not when it moves into the open list. */
  onBlur?: () => void;
  /** Names the control when it has no visible `label`. */
  "aria-label"?: string | undefined;
  /** Classes for the button. */
  className?: string | undefined;
}

/**
 * A dropdown: a button showing the chosen option, opening a list to pick
 * from (Lightning's `custom-select`, new_inputs.ex). Headless UI's Listbox
 * gives it the keyboard (arrows, Home/End, type-ahead, Enter/Space, Escape)
 * and the listbox ARIA. A value that matches no option shows the prompt.
 */
export function Select({
  label,
  required,
  hint,
  errors = [],
  fieldClassName,
  options,
  prompt,
  className,
  id: givenId,
  name,
  value,
  disabled,
  onChange,
  onBlur,
  "aria-label": ariaLabel,
}: SelectProps) {
  const id = useFieldId(givenId);
  const items = options.map(optionParts);
  const button = useRef<HTMLButtonElement>(null);
  // Focus can move between the button and the open list; only leaving both is a blur.
  const leave = (e: FocusEvent) => {
    const to = e.relatedTarget as HTMLElement | null;
    if (to !== button.current && !to?.closest("[role=listbox]")) onBlur?.();
  };
  // Headless UI's Label is a span, without `for`, so clicking it focuses the button by hand
  // (but not a click on a link or button inside the label, such as an InfoTooltip).
  const labelText = (text: ReactNode, className?: string) => (
    <HeadlessLabel
      as="span"
      className={className}
      onClick={(e) => {
        if ((e.target as Element).closest("a, button")) return;
        // Without `for`, the label would pass the click on to the first button inside it.
        e.preventDefault();
        button.current?.focus();
      }}
    >
      {text}
      {required && <span className="sr-only"> (required)</span>}
    </HeadlessLabel>
  );
  // Headless UI's Label names the button "<label> <chosen option>", as a
  // native select is read. A `for` on the label would replace that name with
  // the label alone, so Field gets no id.
  return (
    <Listbox
      value={value}
      {...(name !== undefined && { name })}
      disabled={disabled ?? false}
      invalid={errors.length > 0}
      // Like a native select, picking the option already chosen changes nothing.
      onChange={(v: string) => v !== value && onChange?.({ target: { value: v } })}
    >
      <Field label={label && labelText(label)} required={required} hint={hint} errors={errors} className={fieldClassName}>
        {!label && ariaLabel && labelText(ariaLabel, "sr-only")}
        <ListboxButton
          ref={button}
          id={id}
          data-ui="field"
          onBlur={leave}
          // Headless UI submits the form on Enter; a native select doesn't. Space and the arrows open it.
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          className={controlClasses(errors.length > 0, cn("grid grid-cols-1 border py-2 pl-3 pr-2 text-left", className))}
        >
          <span className="col-start-1 row-start-1 truncate pr-6">{items.find(([, v]) => v === value)?.[0] ?? prompt ?? "\u00a0"}</span>
          <span className="hero-chevron-up-down col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4" />
        </ListboxButton>
        <ListboxOptions
          anchor={{ to: "bottom start", gap: 4 }}
          transition
          data-ui="listbox"
          onBlur={leave}
          className={cn(floatingPanelClasses, "max-h-60 min-w-(--button-width) overflow-auto py-1 text-base sm:text-sm")}
        >
          {items.map(([l, v]) => (
            <ListboxOption
              key={v}
              value={v}
              className="group relative cursor-default select-none py-2 pl-8 pr-4 text-gray-900 data-focus:bg-primary-600 data-focus:text-white"
            >
              <span className="block truncate group-data-selected:font-semibold">{l}</span>
              <span className="hero-check invisible absolute inset-y-0 left-1.5 my-auto size-5 text-primary-600 group-data-focus:text-white group-data-selected:visible" />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Field>
    </Listbox>
  );
}

type ChoiceProps = { label: ReactNode; hint?: ReactNode; ref?: Ref<HTMLInputElement> } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

const choiceClasses = "h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600 transition duration-200 cursor-pointer disabled:cursor-not-allowed";

/** A checkbox with its label to the right. `indeterminate` shows a dash, e.g. a partly-selected "select all". */
export function Checkbox({ label, hint, className, indeterminate = false, ref, ...rest }: ChoiceProps & { indeterminate?: boolean }) {
  const setRef = (el: HTMLInputElement | null) => {
    if (el) el.indeterminate = indeterminate;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };
  return <Choice type="checkbox" label={label} hint={hint} className={cn("rounded", className)} ref={setRef} {...rest} />;
}

/** A radio button with its label to the right. Group them with the same `name`. */
export function Radio({ label, hint, className, ...rest }: ChoiceProps) {
  return <Choice type="radio" label={label} hint={hint} className={className} {...rest} />;
}

function Choice({ label, hint, className, ...rest }: ChoiceProps & { type: "checkbox" | "radio" }) {
  return (
    <label className={cn("flex gap-2 text-sm leading-6 text-gray-700", hint ? "items-start" : "items-center")}>
      <input data-ui="choice" className={cn(choiceClasses, hint && "mt-1", className)} {...rest} />
      <span>
        {label}
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
    </label>
  );
}
