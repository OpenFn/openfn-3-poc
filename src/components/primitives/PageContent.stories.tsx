import type { Meta, StoryObj } from "@storybook/react";
import { Centered, PageContent } from "./PageContent";
import Header from "./Header";

const meta: Meta = { title: "Primitives/PageContent" };
export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="h-96">
      <PageContent header={<Header title="Projects" />}>
        <Centered>
          <p className="text-sm text-muted">Page body</p>
        </Centered>
      </PageContent>
    </div>
  ),
};
