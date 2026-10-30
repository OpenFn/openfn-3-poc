import type { Meta, StoryObj } from "@storybook/react";
import { Centered, PageContent } from "./PageContent";
import Header from "./Header";
import Alert from "./Alert";
import Card from "./Card";

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

export const WithBanner: StoryObj = {
  render: () => (
    <div className="h-96">
      <PageContent
        banner={
          <Alert tone="info" className="rounded-none">
            You are viewing a sandbox. Changes here do not sync to the parent project until you merge.
          </Alert>
        }
        header={<Header title="Workflows" />}
      >
        <Centered>
          <p className="text-sm text-muted">Page body</p>
        </Centered>
      </PageContent>
    </div>
  ),
};

/** `Centered` caps the body at max-w-7xl and centres it; here on a wide canvas. */
export const CenteredBody: StoryObj = {
  render: () => (
    <div className="h-96">
      <PageContent header={<Header title="Projects" />}>
        <Centered>
          <Card>Body content stops at the centred column.</Card>
        </Centered>
      </PageContent>
    </div>
  ),
};
