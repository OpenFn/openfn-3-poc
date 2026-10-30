import { createContext } from "react";

/** True while the Form around it is saving; a submit Button inside reads it, so pages pass `pending` once. */
export const FormPendingContext = createContext(false);
