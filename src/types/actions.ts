/**
 * The five kinds of `on*` prop a page's contract takes. The kind says how the
 * host answers and where the page shows a rejection, so a prop's own doc only
 * says what is special about it. Every one resolves once the host has
 * answered and rejects with a `RequestError` (src/utils/errors.ts) or any
 * error with a message. Types only: no data, no behaviour.
 */

/**
 * Submits a form on the page (`useForm`'s `submit`). Resolve on success: the
 * form is clean again. When the argument is the form's values `V`, reject
 * with a `RequestError` whose `fieldErrors` keys are `keyof V` (a
 * `FieldErrors<V>`), and the messages show on those fields; when it isn't,
 * the prop's doc names the field-error keys. Any other rejection, or a key
 * that isn't a field, shows its message in an Alert by the form.
 */
export type FormAction<V> = (values: V) => Promise<void>;

/**
 * Submits a modal (`FormModal`, `ConfirmModal`, or `useForm`'s `modalSubmit`).
 * Resolve once done, with what the page needs from the reply (`R`); the page
 * then closes the modal or moves it on to its next step. On a rejection the
 * modal stays open. When an argument is the modal form's values,
 * `fieldErrors` keys are that form's fields and show on them; otherwise the
 * prop's doc names the keys. Any other rejection shows its message above the
 * form.
 */
export type ModalAction<A extends unknown[] = [], R = void> = (...args: A) => Promise<R>;

/**
 * A button that acts at once (`useAction` with `onError: "toast"`). Resolve
 * once done, with what the page needs from the reply (`R`). A rejection's
 * message shows as an error toast and the page stays as it was.
 */
export type ButtonAction<A extends unknown[] = [], R = void> = (...args: A) => Promise<R>;

/**
 * Saves a control on every change, a switch or a select (`useChosenValue`).
 * The control shows the choice at once and keeps it while the request runs;
 * the host then sends the saved value back as props. On a rejection the
 * control goes back to the saved value and the message shows as an error toast.
 */
export type ChoiceAction<T> = (value: T) => Promise<void>;

/**
 * Fetches something the page shows, often when the user opens it (`useAction`
 * with `latest` and `onSuccess`). Resolve with the result. Only the newest
 * load counts: an answer that arrives after the user moved on is dropped. The
 * prop's doc says where a rejection's message shows.
 */
export type LoadAction<A extends unknown[], R> = (...args: A) => Promise<R>;
