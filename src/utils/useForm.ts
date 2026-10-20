import { useState, type ChangeEvent, type FormEvent } from "react";
import { RequestError } from "./errors";
import { useAction } from "./useAction";

/** Messages per field, in Lightning's changeset wording ("can't be blank"). */
export type FieldErrors<V> = Partial<Record<keyof V, string[]>>;

/** The fields that hold a string, which `fieldProps` can wire to an input. */
type StringKeys<V> = { [K in keyof V]: V[K] extends string ? K : never }[keyof V];

export interface FormOptions<V> {
  /** The saved values. The form is `dirty` while `values` differ from them. */
  initial: V;
  /** Client validation: messages for the invalid fields, nothing for the rest. */
  validate?: (values: V) => FieldErrors<V>;
}

/**
 * One form's state (STANDARDS.md pattern 2): values, dirty, client
 * validation and server field errors. A field's client errors show once it
 * has been blurred, and every field's on submit. Server errors show at once
 * and clear when their field changes. Don't disable submit because the form
 * is invalid: submitting is how the user sees why.
 *
 * A page form submits with `onSubmit={form.submit(save)}`: it runs through
 * `useAction` (`pending`, `error`, double-submit guard), puts a
 * `RequestError`'s field errors on the fields, and on success makes the
 * submitted values the saved ones, so the form is clean again. A FormModal
 * form passes its own `onSubmit` and routes field errors back with
 * `onFieldErrors={form.setErrors}`.
 */
export function useForm<V extends object>({ initial, validate }: FormOptions<V>) {
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState<Partial<Record<keyof V, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors<V>>({});

  const keys = Object.keys(values) as (keyof V)[];
  const clientErrors: FieldErrors<V> = validate?.(values) ?? {};
  const valid = keys.every((k) => !clientErrors[k]?.length);
  const dirty = keys.some((k) => !Object.is(values[k], saved[k]));
  const errors = {} as Record<keyof V, string[]>;
  for (const k of keys) {
    const client = submitted || touched[k] ? (clientErrors[k] ?? []) : [];
    errors[k] = [...client, ...(serverErrors[k] ?? [])];
  }

  const set = <K extends keyof V>(field: K, value: V[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    setServerErrors((e) => ({ ...e, [field]: undefined }));
  };

  const check = () => {
    setSubmitted(true);
    return valid;
  };

  const action = useAction(async (save: (values: V) => void | Promise<void>) => {
    try {
      await save(values);
    } catch (e) {
      if (e instanceof RequestError && e.hasFieldErrors) {
        setServerErrors(e.fieldErrors as FieldErrors<V>);
        return;
      }
      throw e;
    }
    setSaved(values);
  });

  return {
    values,
    set,
    errors,
    dirty,
    valid,
    pending: action.pending,
    /** The last failed submit that wasn't field errors; show it as an `Alert` by the form. */
    error: action.error,
    /** Puts server field errors on the fields, e.g. from `FormModal onFieldErrors`. */
    setErrors: (fieldErrors: Record<string, string[]>) => setServerErrors(fieldErrors as FieldErrors<V>),
    /** Back to the saved values (or `next`, which becomes the saved values), with no errors showing. */
    reset: (next: V = saved) => {
      setSaved(next);
      setValues(next);
      setTouched({});
      setSubmitted(false);
      setServerErrors({});
      action.reset();
    },
    /** Value, change, blur and errors for a `TextInput`, `TextArea`, `Select` or `PasswordInput`. */
    fieldProps: <K extends StringKeys<V>>(field: K) => ({
      value: values[field] as string,
      errors: errors[field],
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(field, e.target.value as V[K]),
      onBlur: () => setTouched((t) => ({ ...t, [field]: true })),
    }),
    /** Shows every client error and says whether the form is valid. A FormModal form returns early from its `onSubmit` when it's false. */
    check,
    /** A form `onSubmit` handler: shows every client error, and runs `save` if the form is valid. */
    submit: (save: (values: V) => void | Promise<void>) => (e?: FormEvent) => {
      e?.preventDefault();
      if (check()) void action.run(save);
    },
  };
}
