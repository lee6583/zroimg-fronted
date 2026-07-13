type DocsItem = {
  id: string;
  title: string;
  body: string;
};

type DocsGroup = {
  title: string;
  items: DocsItem[];
};

type DocsConfig = {
  title: string;
  description: string;
  groups: DocsGroup[];
};

type SaveDocsConfigRequest = {
  title: string;
  description: string;
  groups: unknown;
};

type SaveDocsConfigResponse = {
  docs: DocsConfig;
};

export type { DocsItem, DocsGroup, DocsConfig, SaveDocsConfigRequest, SaveDocsConfigResponse };
