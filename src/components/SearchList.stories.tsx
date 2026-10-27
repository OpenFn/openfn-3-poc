import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import SearchList from "./SearchList";
import { adaptors } from "../mock-data/adaptors";
import type { Adaptor } from "../types/adaptors";
import { projects } from "../mock-data/projects";
import type { Project } from "../mock-data/models/projects";
import { matchesQuery } from "../utils/search";

const meta: Meta<typeof SearchList> = {
  title: "Shared/SearchList",
  component: SearchList,
  decorators: [
    (Story) => (
      // eslint-disable-next-line no-restricted-syntax -- the same faint gray-700 ring as Modal; no named colour is a tint
      <div className="w-lg rounded-xl bg-surface shadow-lg ring-1 ring-gray-700/10">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof SearchList>;

/** Command-palette look: full-width rows that turn primary. Arrow keys wrap. */
export const Large: Story = {
  render: function Render() {
    const [query, setQuery] = useState("");
    const items = projects.filter((p) => matchesQuery(query, p.name));
    return (
      <SearchList<Project>
        size="lg"
        items={items}
        getKey={(p) => p.id}
        isSelected={(p) => p.id === projects[0]!.id}
        query={query}
        onQueryChange={setQuery}
        onSelect={() => {}}
        placeholder="Search projects..."
        emptyState="No projects found"
        renderItem={(p, { selected }) => (
          <>
            <span className="hero-folder mr-2 h-5 w-5 shrink-0" />
            <span className={selected ? "grow font-semibold" : "grow"}>{p.name}</span>
          </>
        )}
      />
    );
  },
};

/** Field look with headed sections and a header row (shown when nothing matches). */
export const SmallWithSections: Story = {
  render: function Render() {
    const [query, setQuery] = useState("");
    const inUse = ["http", "dhis2"];
    const matches = adaptors.filter((a) => matchesQuery(query, a.name, a.id));
    return (
      <div className="p-4">
        <SearchList<Adaptor>
          size="sm"
          sections={[
            { key: "in-project", heading: "Adaptors in this project", items: matches.filter((a) => inUse.includes(a.id)) },
            { key: "all", heading: "All adaptors", items: matches.filter((a) => !inUse.includes(a.id)) },
          ]}
          header={matches.length === 0 && <p className="text-sm text-muted">Nothing matches "{query}".</p>}
          getKey={(a) => a.id}
          query={query}
          onQueryChange={setQuery}
          onSelect={() => {}}
          placeholder="Search for an adaptor to connect..."
          renderItem={(a) => <span className="text-strong">{a.name}</span>}
        />
      </div>
    );
  },
};
