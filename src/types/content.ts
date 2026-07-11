export type DocsItem = {
  id: string;
  title: string;
  body: string;
};

export type DocsGroup = {
  title: string;
  items: DocsItem[];
};

export type DocsConfig = {
  title: string;
  description: string;
  groups: DocsGroup[];
};

export type SaveDocsConfigRequest = {
  title: string;
  description: string;
  groups: unknown;
};

export type SaveDocsConfigResponse = {
  docs: DocsConfig;
};
