import { Table, Td, Th, Tr } from "../primitives/Table";
import Button from "../primitives/Button";
import DateTime from "../primitives/DateTime";
import Heading from "../primitives/Heading";
import IconButton from "../primitives/IconButton";
import type { ApiToken } from "../../types/tokens";
import Text from "../primitives/Text";

/**
 * The personal access tokens table (tokens_live/index.html.heex): masked
 * token, created and last-used dates, and a trash link to the delete modal.
 * With no tokens, the fingerprint empty state follows the (header-only) table.
 */
export default function TokensTable({ tokens, onGenerate }: { tokens: ApiToken[]; onGenerate?: () => void }) {
  return (
    <>
      <Table
        id="tokens"
        header={
          <Tr>
            <Th>Token</Th>
            <Th>Created on</Th>
            <Th>Last Used at</Th>
          </Tr>
        }
      >
        {tokens.map((token) => (
          <Tr key={token.id} id={`tokens-${token.id}`}>
            <Td>
              <code className="whitespace-nowrap">{token.masked}</code>
            </Td>
            <Td className="whitespace-nowrap font-medium">
              <DateTime value={token.insertedAt} />
            </Td>
            <Td>
              <div className="flex items-center justify-between whitespace-nowrap font-medium">
                {token.lastUsedAt ? <DateTime value={token.lastUsedAt} /> : "Never used"}
                <IconButton
                  id={`delete-token-${token.id}`}
                  to={`/profile/tokens/${token.id}/delete`}
                  icon="hero-trash"
                  tone="danger"
                  label="Delete token"
                  size="xs"
                />
              </div>
            </Td>
          </Tr>
        ))}
      </Table>
      {tokens.length === 0 && (
        <div className="flex items-center gap-2 p-4">
          <span className="hero-finger-print h-12 w-12" />
          <div className="flex-1">
            <Heading size="sm">No Personal Access Tokens</Heading>
            <Text as="p" className="mt-1 text-muted">
              Get started by creating a new access token.
            </Text>
          </div>
          <Button id="generate_new_token" onClick={onGenerate} icon="hero-plus">
            Generate New Token
          </Button>
        </div>
      )}
    </>
  );
}
