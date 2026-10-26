"use client";

import clsx from "clsx";
import { Plus, Settings2, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { adminModelsApi } from "@/api/admin/models";
import type {
  AdminGenerationModel,
  GenerationModelCatalogItem,
  GenerationProviderConnection,
} from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import { MoreMenu } from "./admin-form";
import workspace from "./admin-workspace.module.css";
import { ModelForm, modelTypeLabels, qualityLabels } from "./model-form";
import {
  adapterLabels,
  ProviderConnectionPanel,
  sortConnections,
  upsertConnection,
} from "./provider-connection-panel";
import type { ConnectionSaveResult } from "./provider-connection-panel";

type ModelManagerProps = {
  initialModels: AdminGenerationModel[];
  catalog: GenerationModelCatalogItem[];
  initialConnections: GenerationProviderConnection[];
};

type EditorState = {
  model: AdminGenerationModel | null;
};

function capabilitiesText(model: AdminGenerationModel) {
  if (model.modelType === "video") {
    return model.imageToVideoEnabled ? "文生视频 · 图生视频" : "文生视频";
  }
  const labels = ["文生图"];
  if (model.imageToImageEnabled) {
    labels.push("图生图");
  }
  if (model.inpaintEnabled) {
    labels.push("局部重绘");
  }
  return labels.join(" · ");
}

function pricingText(model: AdminGenerationModel) {
  if (model.modelType === "video") {
    const parts = model.supportedResolutions.map((resolution) => {
      const points = model.pointsPerSecondByResolution[resolution] ?? "-";
      return `${resolution} ${points}/秒`;
    });
    return parts.join(" · ");
  }

  const parts = model.supportedQualities.map((quality) => {
    const points = model.pointsByQuality[quality] ?? "-";
    return `${qualityLabels[quality] ?? quality} ${points}`;
  });
  return parts.join(" · ");
}

export function ModelManager(props: ModelManagerProps) {
  const catalog = props.catalog;

  const [models, setModels] = useState(props.initialModels);
  const [connections, setConnections] = useState(() => sortConnections(props.initialConnections));
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [message, setMessage] = useState("");
  const [isPanelOpen, setPanelOpen] = useState(false);

  function replaceModel(model: AdminGenerationModel) {
    setModels((current) => {
      const isListed = current.some((item) => item.id === model.id);
      let next = [...current, model];
      if (isListed) {
        next = current.map((item) => (item.id === model.id ? model : item));
      }

      // 同类型只能有一个默认模型。
      return next.map((item) => {
        const isOtherDefault =
          model.defaultFlag === 1 && item.id !== model.id && item.modelType === model.modelType;
        return isOtherDefault ? { ...item, defaultFlag: 0 } : item;
      });
    });
  }

  function openEditor(model: AdminGenerationModel | null) {
    setMessage("");
    setEditor({ model });
  }

  function saveModel(model: AdminGenerationModel) {
    replaceModel(model);
    setEditor(null);
  }

  function applyConnection(connection: GenerationProviderConnection, isConfigChanged: boolean) {
    setConnections((current) => upsertConnection(current, connection));
    if (!isConfigChanged) {
      return;
    }

    // 供应商配置变化后，绑定该连接的模型需要重新验证。
    setModels((current) =>
      current.map((model) => {
        if (model.connectionId !== connection.id) {
          return model;
        }
        return {
          ...model,
          status: "disabled",
          defaultFlag: 0,
          verificationStatus: "unverified",
          verifiedAt: null,
        };
      }),
    );
  }

  function saveConnection(result: ConnectionSaveResult) {
    applyConnection(result.connection, result.isConfigChanged);
  }

  function removeConnection(connection: GenerationProviderConnection) {
    setConnections((current) => current.filter((item) => item.id !== connection.id));
  }

  async function toggleStatus(model: AdminGenerationModel) {
    try {
      const status = model.status === "enabled" ? "disabled" : "enabled";
      const nextModel = await adminModelsApi.updateStatus(model.id, status);
      replaceModel(nextModel);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function setDefault(model: AdminGenerationModel) {
    try {
      const nextModel = await adminModelsApi.setDefault(model.id);
      replaceModel(nextModel);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function remove(model: AdminGenerationModel) {
    if (!window.confirm(`确定删除模型“${model.modelName}”吗？`)) {
      return;
    }
    try {
      await adminModelsApi.remove(model.id);
      setModels((current) => current.filter((item) => item.id !== model.id));
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  function menuItems(model: AdminGenerationModel) {
    const items = [];
    const canSetDefault = model.defaultFlag !== 1 && model.connectionId !== null;
    if (canSetDefault) {
      items.push({
        label: "设为默认",
        icon: <Star size={14} aria-hidden="true" />,
        onSelect: () => setDefault(model),
      });
    }
    items.push({
      label: "删除",
      icon: <Trash2 size={14} aria-hidden="true" />,
      isDanger: true,
      onSelect: () => remove(model),
    });
    return items;
  }

  function renderRow(model: AdminGenerationModel) {
    const isEnabled = model.status === "enabled";
    const isVerified = model.verificationStatus === "verified";
    const price = pricingText(model);
    const capabilities = capabilitiesText(model);
    const isBound = model.connectionId !== null;

    return (
      <tr key={model.id}>
        <td>
          <div className={workspace.primaryCell}>
            <div className={workspace.modelIdentity}>
              <span className={workspace.primaryText} title={model.modelName}>
                {model.modelName}
              </span>
              <span className={workspace.modelBadges}>
                <span className={workspace.badge}>{modelTypeLabels[model.modelType]}</span>
                {model.defaultFlag === 1 ? <span className={workspace.badge}>默认</span> : null}
              </span>
            </div>
            <span className={workspace.monoText} title={model.providerModelCode}>
              {model.providerModelCode}
            </span>
          </div>
        </td>
        <td>
          {isBound ? (
            <div className={workspace.primaryCell}>
              <span className={workspace.truncate} title={model.connectionName ?? undefined}>
                {model.connectionName}
              </span>
              <span className={workspace.secondaryText}>{adapterLabels[model.adapter]}</span>
            </div>
          ) : (
            <span className={clsx(workspace.badge, workspace.badgeWarning)}>未绑定连接</span>
          )}
        </td>
        <td>
          <span className={workspace.truncate} title={capabilities}>
            {capabilities}
          </span>
        </td>
        <td>
          <span className={clsx(workspace.truncate, workspace.priceText)} title={price}>
            {price}
          </span>
        </td>
        <td>
          <div className={workspace.primaryCell}>
            <span
              className={clsx(
                workspace.status,
                isEnabled ? workspace.statusSuccess : workspace.statusWarning,
              )}
            >
              {isEnabled ? "启用" : "停用"}
            </span>
            <span
              className={clsx(workspace.secondaryText, isVerified && workspace.statusSuccessText)}
            >
              {isVerified ? "已验证" : "未验证"}
            </span>
          </div>
        </td>
        <td className={workspace.actionCell}>
          <div className={workspace.rowActions}>
            <button className={workspace.rowButton} type="button" onClick={() => openEditor(model)}>
              编辑
            </button>
            <button
              className={workspace.rowButton}
              type="button"
              disabled={!isBound && !isEnabled}
              title={isBound ? undefined : "请先为模型绑定中转站连接"}
              onClick={() => toggleStatus(model)}
            >
              {isEnabled ? "停用" : "启用"}
            </button>
            <MoreMenu label="更多" items={menuItems(model)} />
          </div>
        </td>
      </tr>
    );
  }

  if (editor) {
    return (
      <div className={workspace.workspace}>
        <ModelForm
          key={editor.model?.id ?? "new"}
          model={editor.model}
          catalog={catalog}
          connections={connections}
          onSaved={saveModel}
          onClose={() => setEditor(null)}
          onConnectionSaved={applyConnection}
          onConnectionRemoved={removeConnection}
        />
      </div>
    );
  }

  return (
    <div className={workspace.workspace}>
      <header className={workspace.header}>
        <div className={workspace.headerCopy}>
          <h1 className="page-title">模型配置</h1>
        </div>
        <div className={workspace.headerActions}>
          <button
            className={workspace.secondaryAction}
            type="button"
            onClick={() => setPanelOpen(true)}
          >
            <Settings2 size={15} aria-hidden="true" />
            中转站连接
          </button>
          <button
            className={workspace.primaryAction}
            type="button"
            onClick={() => openEditor(null)}
            disabled={catalog.length === 0}
          >
            <Plus size={15} aria-hidden="true" />
            新建模型
          </button>
        </div>
      </header>
      {message ? <p className={workspace.inlineMessage}>{message}</p> : null}
      <section className={workspace.panel}>
        {models.length ? (
          <div className={workspace.tableWrap}>
            <table className={clsx(workspace.table, workspace.modelsTable)}>
              <colgroup>
                <col />
                <col className={workspace.colMd} />
                <col className={workspace.colXl} />
                <col className={workspace.colXl} />
                <col className={workspace.colStatus} />
                <col className={workspace.colActions} />
              </colgroup>
              <thead>
                <tr>
                  <th>模型</th>
                  <th>连接</th>
                  <th>能力</th>
                  <th>价格</th>
                  <th>状态</th>
                  <th className={workspace.actionCell}>操作</th>
                </tr>
              </thead>
              <tbody>{models.map(renderRow)}</tbody>
            </table>
          </div>
        ) : (
          <div className={workspace.empty}>还没有配置模型</div>
        )}
      </section>

      {isPanelOpen ? (
        <ProviderConnectionPanel
          connections={connections}
          initialMode="list"
          canPickModel={false}
          onClose={() => setPanelOpen(false)}
          onSaved={saveConnection}
          onRemoved={removeConnection}
        />
      ) : null}
    </div>
  );
}
