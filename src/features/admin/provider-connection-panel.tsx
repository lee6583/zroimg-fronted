"use client";

import clsx from "clsx";
import { Link2, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { adminModelsApi } from "@/api/admin/models";
import { AppSelect } from "@/components/ui/app-select";
import type {
  DiscoveredProviderModel,
  GenerationModelAdapter,
  GenerationProviderConnection,
} from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import { Field, SwitchRow } from "./admin-form";
import workspace from "./admin-workspace.module.css";

type DiscoveryState = "idle" | "success" | "empty" | "error";

type PanelMode = "list" | "edit";

type ConnectionForm = {
  id: string | null;
  name: string;
  adapter: GenerationModelAdapter;
  apiBaseUrl: string;
  apiKey: string;
  clearApiKey: boolean;
  status: "enabled" | "disabled";
};

type ConnectionSaveResult = {
  connection: GenerationProviderConnection;
  editedId: string | null;
  isConfigChanged: boolean;
  discoveryState: DiscoveryState;
  discoveredModels: DiscoveredProviderModel[];
};

type ProviderConnectionPanelProps = {
  connections: GenerationProviderConnection[];
  initialMode: PanelMode;
  canPickModel: boolean;
  onClose: () => void;
  onSaved: (result: ConnectionSaveResult) => void;
  onRemoved: (connection: GenerationProviderConnection) => void;
  onPick?: (
    connectionId: string,
    model: DiscoveredProviderModel,
    discovered: DiscoveredProviderModel[],
  ) => void;
};

const adapterLabels: Record<GenerationModelAdapter, string> = {
  openai: "OpenAI",
  grok: "Grok",
};

function emptyForm(): ConnectionForm {
  return {
    id: null,
    name: "",
    adapter: "openai",
    apiBaseUrl: "",
    apiKey: "",
    clearApiKey: false,
    status: "disabled",
  };
}

function formFromConnection(connection: GenerationProviderConnection): ConnectionForm {
  return {
    id: connection.id,
    name: connection.name,
    adapter: connection.adapter,
    apiBaseUrl: connection.apiBaseUrl,
    apiKey: "",
    clearApiKey: false,
    status: connection.status,
  };
}

function sortConnections(connections: GenerationProviderConnection[]) {
  return [...connections].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "enabled" ? -1 : 1;
    }
    return a.name.localeCompare(b.name, "zh-CN");
  });
}

function upsertConnection(
  connections: GenerationProviderConnection[],
  connection: GenerationProviderConnection,
) {
  const isListed = connections.some((item) => item.id === connection.id);
  if (isListed) {
    const next = connections.map((item) => (item.id === connection.id ? connection : item));
    return sortConnections(next);
  }

  return sortConnections([...connections, connection]);
}

export function ProviderConnectionPanel(props: ProviderConnectionPanelProps) {
  const connections = props.connections;
  const canPickModel = props.canPickModel;
  const onClose = props.onClose;
  const onSaved = props.onSaved;
  const onRemoved = props.onRemoved;
  const onPick = props.onPick;

  const [mode, setMode] = useState<PanelMode>(props.initialMode);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);
  const [discovered, setDiscovered] = useState<DiscoveredProviderModel[]>([]);
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState>("idle");
  const [isDiscovering, setDiscovering] = useState(false);

  function resetDiscovery() {
    setDiscovered([]);
    setDiscoveryState("idle");
  }

  function openCreate() {
    setMode("edit");
    setForm(emptyForm());
    setMessage("");
    resetDiscovery();
  }

  function openEdit(connection: GenerationProviderConnection) {
    setMode("edit");
    setForm(formFromConnection(connection));
    setMessage("");
    resetDiscovery();
  }

  function backToList() {
    setMode("list");
    setForm(emptyForm());
    setMessage("");
    resetDiscovery();
  }

  function updateForm(patch: Partial<ConnectionForm>) {
    const hasNewKey = typeof patch.apiKey === "string" && Boolean(patch.apiKey.trim());
    const nextPatch = hasNewKey ? { ...patch, clearApiKey: false } : patch;
    setForm((current) => ({ ...current, ...nextPatch }));
    const isProviderChange =
      "adapter" in patch || "apiBaseUrl" in patch || "apiKey" in patch || "clearApiKey" in patch;
    if (isProviderChange) {
      resetDiscovery();
    }
  }

  function clearKey() {
    if (!window.confirm("确定清除当前 API Key 吗？保存后生效。")) {
      return;
    }
    updateForm({ apiKey: "", clearApiKey: true });
  }

  async function discover() {
    if (form.clearApiKey && !form.apiKey.trim()) {
      setMessage("已清除 API Key，请先填写新的 API Key 后再拉取模型");
      return;
    }
    resetDiscovery();
    setDiscovering(true);
    setMessage("");
    try {
      const apiKey = form.apiKey.trim();
      let models: DiscoveredProviderModel[];
      if (form.id && !apiKey) {
        models = await adminModelsApi.discoverSaved(form.id);
      } else {
        models = await adminModelsApi.discover({
          adapter: form.adapter,
          apiBaseUrl: form.apiBaseUrl.trim(),
          apiKey,
        });
      }

      setDiscovered(models);
      if (models.length > 0) {
        setDiscoveryState("success");
      } else {
        setDiscoveryState("empty");
        setMessage("中转站没有返回可用模型");
      }
    } catch (error) {
      setDiscovered([]);
      setDiscoveryState("error");
      setMessage(getErrorMessage(error));
    } finally {
      setDiscovering(false);
    }
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      if (!form.name.trim()) {
        throw new Error("请输入连接名称");
      }
      if (!form.apiBaseUrl.trim()) {
        throw new Error("请输入中转站地址");
      }
      if (form.status === "enabled" && !form.apiKey.trim() && !form.id) {
        throw new Error("启用连接时必须填写 API Key");
      }
      if (form.clearApiKey && form.apiKey.trim()) {
        throw new Error("不能同时替换和清除 API Key");
      }

      // 第一步：判断保存是否改变了供应商配置，改变后已拉取的模型列表不再可信。
      const apiBaseUrl = form.apiBaseUrl.trim();
      const previous = connections.find((item) => item.id === form.id);
      let isConfigChanged = false;
      if (previous) {
        isConfigChanged =
          previous.adapter !== form.adapter ||
          previous.apiBaseUrl !== apiBaseUrl ||
          previous.status !== form.status ||
          form.clearApiKey ||
          Boolean(form.apiKey.trim());
      }

      // 第二步：提交连接。
      const data = {
        name: form.name.trim(),
        adapter: form.adapter,
        apiBaseUrl,
        apiKey: form.apiKey.trim(),
        clearApiKey: form.clearApiKey,
        status: form.status,
      };
      let connection: GenerationProviderConnection;
      if (form.id) {
        connection = await adminModelsApi.updateConnection(form.id, data);
      } else {
        connection = await adminModelsApi.createConnection({ ...data, clearApiKey: false });
      }

      // 第三步：把结果交给上层同步列表和模型表单。
      onSaved({
        connection,
        editedId: form.id,
        isConfigChanged,
        discoveryState,
        discoveredModels: discovered,
      });
      if (!canPickModel) {
        backToList();
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function remove(connection: GenerationProviderConnection) {
    if (!window.confirm(`确定删除连接“${connection.name}”吗？`)) {
      return;
    }
    try {
      await adminModelsApi.removeConnection(connection.id);
      onRemoved(connection);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  function pick(model: DiscoveredProviderModel) {
    if (!canPickModel || !form.id || !onPick) {
      return;
    }
    onPick(form.id, model, discovered);
  }

  const keyPreview = connections.find((item) => item.id === form.id)?.apiKeyPreview;
  let keyPlaceholder = "请输入 API Key";
  if (form.clearApiKey) {
    keyPlaceholder = "保存后清除当前 API Key";
  } else if (form.id) {
    keyPlaceholder = `留空保留当前密钥${keyPreview ? `（${keyPreview}）` : ""}`;
  }
  const canClearKey = Boolean(form.id && keyPreview) && !form.clearApiKey;

  return (
    <div className={workspace.modalLayer} role="presentation">
      <button
        className={workspace.modalBackdrop}
        type="button"
        aria-label="关闭中转站连接"
        onClick={onClose}
      />
      <section
        className={workspace.connectionPanel}
        role="dialog"
        aria-modal="true"
        aria-label="中转站连接"
      >
        <header className={workspace.connectionPanelHeader}>
          <div className={workspace.connectionPanelTitleRow}>
            <Link2 size={17} aria-hidden="true" />
            <h2>{mode === "list" ? "中转站连接" : "连接设置"}</h2>
          </div>
          <button className={workspace.iconAction} type="button" title="关闭" onClick={onClose}>
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        {mode === "list" ? (
          <>
            <div className={workspace.connectionPanelToolbar}>
              <span className={workspace.secondaryText}>{connections.length} 个连接</span>
              <button className={workspace.primaryAction} type="button" onClick={openCreate}>
                <Plus size={15} aria-hidden="true" />
                新建连接
              </button>
            </div>
            {message ? <p className={workspace.inlineMessage}>{message}</p> : null}
            <div className={workspace.connectionList}>
              {connections.length ? (
                connections.map((connection) => (
                  <article key={connection.id} className={workspace.connectionItem}>
                    <div className={workspace.connectionItemMain}>
                      <div className={workspace.connectionItemTitle}>
                        <strong>{connection.name}</strong>
                        <span className={workspace.badge}>{adapterLabels[connection.adapter]}</span>
                        <span
                          className={clsx(
                            workspace.status,
                            connection.status === "enabled"
                              ? workspace.statusSuccess
                              : workspace.statusWarning,
                          )}
                        >
                          {connection.status === "enabled" ? "启用" : "停用"}
                        </span>
                      </div>
                      <span className={workspace.monoText}>{connection.apiBaseUrl}</span>
                      <span className={workspace.secondaryText}>
                        {connection.hasApiKey ? connection.apiKeyPreview : "未配置 API Key"} ·{" "}
                        {connection.modelCount} 个模型
                      </span>
                    </div>
                    <div className={workspace.rowActions}>
                      <button
                        className={workspace.iconAction}
                        type="button"
                        title="编辑连接"
                        aria-label="编辑连接"
                        onClick={() => openEdit(connection)}
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                      <button
                        className={clsx(workspace.iconAction, workspace.textActionDanger)}
                        type="button"
                        title="删除连接"
                        aria-label="删除连接"
                        onClick={() => remove(connection)}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className={workspace.empty}>还没有中转站连接</div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className={workspace.connectionPanelBody}>
              {message ? <p className={workspace.inlineMessage}>{message}</p> : null}
              <div className={workspace.formGrid}>
                <Field label="连接名称">
                  <input
                    className={workspace.formField}
                    value={form.name}
                    maxLength={100}
                    onChange={(event) => updateForm({ name: event.target.value })}
                  />
                </Field>
                <Field label="供应商适配器" isGroup>
                  <AppSelect
                    value={form.adapter}
                    triggerClassName={workspace.selectTrigger}
                    onChange={(adapter) => updateForm({ adapter })}
                    options={(Object.keys(adapterLabels) as GenerationModelAdapter[]).map(
                      (adapter) => ({ value: adapter, label: adapterLabels[adapter] }),
                    )}
                  />
                </Field>
                <Field label="中转站地址" isFull>
                  <input
                    className={workspace.formField}
                    type="url"
                    value={form.apiBaseUrl}
                    placeholder="https://example.com/v1"
                    onChange={(event) => updateForm({ apiBaseUrl: event.target.value })}
                  />
                </Field>
                <Field label="API Key" isFull>
                  <span className={workspace.inlineRow}>
                    <input
                      className={workspace.formField}
                      type="password"
                      autoComplete="new-password"
                      value={form.apiKey}
                      placeholder={keyPlaceholder}
                      onChange={(event) => updateForm({ apiKey: event.target.value })}
                    />
                    {canClearKey ? (
                      <button
                        className={workspace.secondaryAction}
                        type="button"
                        onClick={clearKey}
                      >
                        清除
                      </button>
                    ) : null}
                  </span>
                </Field>
              </div>
              <div className={workspace.switchList}>
                <SwitchRow
                  label="启用连接"
                  checked={form.status === "enabled"}
                  onChange={(checked) => updateForm({ status: checked ? "enabled" : "disabled" })}
                />
              </div>

              <div className={workspace.connectionDiscoveryBlock}>
                <div className={workspace.connectionToolbar}>
                  <span className={workspace.fieldLabel}>可用模型</span>
                  <button
                    className={workspace.secondaryAction}
                    type="button"
                    disabled={isDiscovering}
                    onClick={discover}
                  >
                    <RefreshCw size={14} aria-hidden="true" />
                    {isDiscovering ? "拉取中" : "拉取模型"}
                  </button>
                </div>
                {discovered.length ? (
                  <div className={workspace.discoveredList}>
                    {discovered.map((model) => (
                      <button
                        key={model.id}
                        className={workspace.discoveredItem}
                        type="button"
                        disabled={!canPickModel || !form.id}
                        onClick={() => pick(model)}
                      >
                        <span>{model.id}</span>
                        <span className={workspace.secondaryText}>
                          {model.ownedBy || model.displayName}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <footer className={workspace.connectionPanelFooter}>
              <button className={workspace.secondaryAction} type="button" onClick={backToList}>
                返回
              </button>
              <button
                className={workspace.primaryAction}
                type="button"
                disabled={isSaving}
                onClick={save}
              >
                <Save size={15} aria-hidden="true" />
                {isSaving ? "保存中" : "保存连接"}
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

export { adapterLabels, sortConnections, upsertConnection };
export type { ConnectionSaveResult, DiscoveryState };
