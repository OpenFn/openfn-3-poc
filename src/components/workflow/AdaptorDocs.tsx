// eslint-disable-next-line no-restricted-imports -- wiring: the adaptor registry (catalogue, versions, docs).
import { adaptorFunctions, resolvedAdaptorVersion } from "../../mock-data/adaptors";
import { adaptorShortName, resolveAdaptor } from "../../utils/adaptors";
import Disclosure from "../primitives/Disclosure";
import Heading from "../primitives/Heading";
import TextLink from "../primitives/TextLink";

/**
 * The IDE's Docs panel (assets/js/adaptor-docs/components/DocsPanel.tsx):
 * package name and version, links, editor tips, and the adaptor's
 * operations as expandable signatures.
 */
export default function AdaptorDocs({ adaptor }: { adaptor: string }) {
  const { package: pkg } = resolveAdaptor(adaptor);
  const short = adaptorShortName(adaptor);
  const version = resolvedAdaptorVersion(adaptor);
  const fns = adaptorFunctions(adaptor);
  return (
    <div className="space-y-4 overflow-auto pl-1 text-sm">
      <div className="flex flex-col gap-2">
        <Heading size="lg" as="h1" className="text-body">
          {pkg} ({version})
        </Heading>
        <div>
          <p className="flex flex-wrap gap-x-2">
            External docs:
            <TextLink to={`https://docs.openfn.org/adaptors/packages/${short}-docs`} external>
              docs.openfn.org
            </TextLink>
          </p>
          <p className="flex flex-wrap gap-x-2">
            Source code:
            <TextLink to={`https://github.com/OpenFn/adaptors/tree/%40openfn/language-${short}%40${version}/packages/${short}/src`} external>
              github.com/OpenFn/adaptors
            </TextLink>
          </p>
        </div>
      </div>
      <Disclosure variant="inline" defaultOpen={false} title="Editor tips & shortcuts">
        <div className="space-y-2 border-l-4 border-strong pl-2">
          <p>
            Most adaptors provide intelligent code suggestions to the editor. Start typing and press TAB or ENTER to accept a
            suggestion, or ESC to cancel
          </p>
          <ul className="ml-4 list-disc">
            <li>Press CTRL+SPACE to show suggestions</li>
            <li>Press CTRL+SPACE again to toggle suggestion details (recommended!)</li>
            <li>Press F1 to show the command menu (not all commands will work!)</li>
          </ul>
        </div>
      </Disclosure>
      <div>
        <Heading size="sm">Adaptor API</Heading>
        <p>These are the operations available for this adaptor:</p>
      </div>
      <div className="ml-4 space-y-1">
        {fns.map((fn) => (
          <Disclosure key={fn.name} variant="inline" defaultOpen={false} title={`${fn.name}(${fn.params.join(", ")})`}>
            <div className="flex flex-col gap-2 pb-4 pl-4">
              <p>{fn.description}</p>
              {fn.example && (
                <div className="flex flex-col gap-1">
                  <p className="text-body">Example</p>
                  <div className="px-4">
                    <pre className="overflow-x-auto rounded-md border-2 border-subtle bg-sunken py-2 pr-8 pl-4 font-mono text-xs text-strong">
                      {fn.example}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </Disclosure>
        ))}
      </div>
    </div>
  );
}

/** The Metadata tab (metadata-explorer/Empty.tsx): no adaptor in the demo has magic functions. */
export function AdaptorMetadata({ adaptor }: { adaptor: string }) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <p>{`No metadata found for ${resolveAdaptor(adaptor).package}`}</p>
      <p>This adaptor does not support magic functions yet.</p>
    </div>
  );
}
