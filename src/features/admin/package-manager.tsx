"use client";

import clsx from "clsx";
import { Pencil, Plus, Power, Save, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import { adminPackagesApi } from "@/api/admin/packages";
import { getErrorMessage } from "@/utils/error";
import type { AdminPackage, SavePackageRequest } from "@/types/admin";
import workspace from "./admin-workspace.module.css";

type PackageManagerProps = {
  initialPackages: AdminPackage[];
};

type PackageForm = {
  code: string;
  name: string;
  description: string;
  amount: string;
  credits: string;
  highlights: string;
  recommended: boolean;
  enabled: boolean;
  sort: string;
};

function emptyForm(): PackageForm {
  return {
    code: "",
    name: "",
    description: "",
    amount: "",
    credits: "",
    highlights: "",
    recommended: false,
    enabled: true,
    sort: "0",
  };
}

function formFromPackage(packageItem: AdminPackage): PackageForm {
  return {
    code: packageItem.code,
    name: packageItem.name,
    description: packageItem.description ?? "",
    amount: (packageItem.amountCent / 100).toFixed(2),
    credits: String(packageItem.credits),
    highlights: (packageItem.highlights ?? []).join("\n"),
    recommended: packageItem.recommended,
    enabled: packageItem.enabled,
    sort: String(packageItem.sort),
  };
}

function buildInput(form: PackageForm): SavePackageRequest {
  const amount = Number(form.amount);
  const credits = Number(form.credits);
  const sort = Number(form.sort);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("套餐金额必须大于 0");
  }
  if (!Number.isFinite(credits) || !Number.isInteger(credits) || credits <= 0) {
    throw new Error("套餐积分必须是大于 0 的整数");
  }
  if (!Number.isFinite(sort) || !Number.isInteger(sort)) {
    throw new Error("排序值必须是整数");
  }

  const highlights = form.highlights
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  if (highlights.length === 0) {
    throw new Error("至少填写一个套餐亮点");
  }

  return {
    code: form.code.trim(),
    name: form.name.trim(),
    description: form.description.trim(),
    amountCent: Math.round(amount * 100),
    credits,
    highlights,
    recommended: form.recommended,
    enabled: form.enabled,
    sort,
  };
}

export function PackageManager(props: PackageManagerProps) {
  const [packages, setPackages] = useState(props.initialPackages);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  function updateForm<Key extends keyof PackageForm>(key: Key, value: PackageForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setMessage("");
    setDrawerOpen(true);
  }

  function startEdit(packageItem: AdminPackage) {
    setEditingId(packageItem.id);
    setForm(formFromPackage(packageItem));
    setMessage("");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setMessage("");
  }

  async function savePackage() {
    setMessage("");

    let input: SavePackageRequest;
    try {
      input = buildInput(form);
    } catch (error) {
      setMessage(getErrorMessage(error));
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const saved = await adminPackagesApi.update(editingId, input);
        setPackages((current) => {
          return current.map((item) => (item.id === editingId ? saved : item));
        });
      } else {
        const saved = await adminPackagesApi.create(input);
        setPackages((current) => [...current, saved].sort((a, b) => a.sort - b.sort));
      }

      setDrawerOpen(false);
      setEditingId(null);
      setForm(emptyForm());
      setMessage(editingId ? "套餐修改已保存" : "新套餐已创建");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(packageItem: AdminPackage) {
    try {
      const saved = await adminPackagesApi.updateStatus(packageItem.id, !packageItem.enabled);
      setPackages((current) => current.map((item) => (item.id === saved.id ? saved : item)));
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function toggleRecommend(packageItem: AdminPackage) {
    try {
      const saved = await adminPackagesApi.updateRecommend(
        packageItem.id,
        !packageItem.recommended,
      );
      setPackages((current) => {
        return current.map((item) => {
          if (item.id === saved.id) {
            return saved;
          }
          if (saved.recommended) {
            return { ...item, recommended: false };
          }
          return item;
        });
      });
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function updateSort(packageItem: AdminPackage, value: string) {
    const sort = Number(value);
    if (!Number.isInteger(sort)) {
      setMessage("排序值必须是整数");
      return;
    }

    try {
      const saved = await adminPackagesApi.updateSort(packageItem.id, sort);
      setPackages((current) => {
        const next = current.map((item) => (item.id === saved.id ? saved : item));
        next.sort((itemA, itemB) => itemA.sort - itemB.sort);
        return next;
      });
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function deletePackage(packageItem: AdminPackage) {
    const shouldDelete = window.confirm(`确定删除套餐“${packageItem.name}”吗？`);
    if (!shouldDelete) {
      return;
    }

    try {
      await adminPackagesApi.remove(packageItem.id);
      setPackages((current) => current.filter((item) => item.id !== packageItem.id));
      if (editingId === packageItem.id) {
        closeDrawer();
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <div className={workspace.workspace}>
      <header className={workspace.header}>
        <div className={workspace.headerCopy}>
          <h1 className="page-title">积分套餐</h1>
        </div>
        <div className={workspace.headerActions}>
          <button className={workspace.primaryAction} type="button" onClick={startCreate}>
            <Plus size={15} aria-hidden="true" />
            新建套餐
          </button>
        </div>
      </header>

      <section className={workspace.panel}>
        {message ? <p className={workspace.inlineMessage}>{message}</p> : null}
        {packages.length > 0 ? (
          <div className={workspace.tableWrap}>
            <table className={clsx(workspace.table, workspace.packagesTable)}>
              <colgroup>
                <col />
                <col className={workspace.colSm} />
                <col className={workspace.colSm} />
                <col className={workspace.colStatus} />
                <col className={workspace.colSm} />
                <col className={workspace.colSm} />
                <col className={workspace.colActions} />
              </colgroup>
              <thead>
                <tr>
                  <th>套餐</th>
                  <th>价格</th>
                  <th>积分</th>
                  <th>状态</th>
                  <th>推荐</th>
                  <th>排序</th>
                  <th className={workspace.actionCell}>操作</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((packageItem) => (
                  <tr key={packageItem.id}>
                    <td>
                      <div className={workspace.primaryCell}>
                        <span className={workspace.primaryText} title={packageItem.name}>
                          {packageItem.name}
                        </span>
                        <span className={workspace.monoText}>{packageItem.code}</span>
                        <span
                          className={clsx(workspace.secondaryText, workspace.truncate)}
                          title={packageItem.description ?? undefined}
                        >
                          {packageItem.description}
                        </span>
                      </div>
                    </td>
                    <td className={workspace.numeric}>{packageItem.amountText}</td>
                    <td className={workspace.numeric}>
                      {packageItem.credits.toLocaleString("zh-CN")}
                    </td>
                    <td>
                      <span
                        className={clsx(
                          workspace.status,
                          packageItem.enabled && workspace.statusSuccess,
                        )}
                      >
                        {packageItem.enabled ? "已启用" : "已停用"}
                      </span>
                    </td>
                    <td>
                      {packageItem.recommended ? (
                        <span className={workspace.badge}>推荐</span>
                      ) : (
                        <span className={workspace.secondaryText}>—</span>
                      )}
                    </td>
                    <td>
                      <input
                        className={workspace.sortInput}
                        aria-label={`${packageItem.name}排序`}
                        type="number"
                        defaultValue={packageItem.sort}
                        onBlur={(event) => updateSort(packageItem, event.target.value)}
                      />
                    </td>
                    <td className={workspace.actionCell}>
                      <div className={workspace.rowActions}>
                        <button
                          className={workspace.iconAction}
                          type="button"
                          title="编辑套餐"
                          aria-label={`编辑套餐 ${packageItem.name}`}
                          onClick={() => startEdit(packageItem)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className={workspace.iconAction}
                          type="button"
                          title={packageItem.enabled ? "停用套餐" : "启用套餐"}
                          aria-label={`${packageItem.enabled ? "停用" : "启用"}套餐 ${packageItem.name}`}
                          onClick={() => toggleStatus(packageItem)}
                        >
                          <Power size={14} />
                        </button>
                        <button
                          className={workspace.iconAction}
                          type="button"
                          title={packageItem.recommended ? "取消推荐" : "设为推荐"}
                          aria-label={`${packageItem.recommended ? "取消推荐" : "设为推荐"} ${packageItem.name}`}
                          onClick={() => toggleRecommend(packageItem)}
                        >
                          <Star
                            size={14}
                            fill={packageItem.recommended ? "currentColor" : "none"}
                          />
                        </button>
                        <button
                          className={clsx(workspace.iconAction, workspace.textActionDanger)}
                          type="button"
                          title="删除套餐"
                          aria-label={`删除套餐 ${packageItem.name}`}
                          onClick={() => deletePackage(packageItem)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={workspace.empty}>还没有积分套餐</div>
        )}
      </section>

      {isDrawerOpen ? (
        <>
          <button
            type="button"
            className={workspace.drawerBackdrop}
            aria-label="关闭套餐编辑"
            onClick={closeDrawer}
          />
          <aside
            className={workspace.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="package-editor-title"
          >
            <header className={workspace.drawerHeader}>
              <h2 id="package-editor-title" className={workspace.drawerTitle}>
                {editingId ? "编辑积分套餐" : "新建积分套餐"}
              </h2>
              <button
                className={workspace.iconAction}
                type="button"
                aria-label="关闭"
                title="关闭"
                onClick={closeDrawer}
              >
                <X size={16} />
              </button>
            </header>

            <div className={workspace.drawerBody}>
              <section className={workspace.formSection}>
                <h3 className={workspace.formSectionTitle}>基本信息</h3>
                <div className={workspace.formGrid}>
                  <label className={workspace.fieldGroup}>
                    <span className={workspace.fieldLabel}>套餐编码</span>
                    <input
                      className={workspace.formField}
                      placeholder="例如 PRO_500"
                      value={form.code}
                      onChange={(event) => updateForm("code", event.target.value)}
                    />
                  </label>
                  <label className={workspace.fieldGroup}>
                    <span className={workspace.fieldLabel}>套餐名称</span>
                    <input
                      className={workspace.formField}
                      placeholder="例如 创作进阶"
                      value={form.name}
                      onChange={(event) => updateForm("name", event.target.value)}
                    />
                  </label>
                  <label className={workspace.fieldGroup}>
                    <span className={workspace.fieldLabel}>销售价格（元）</span>
                    <input
                      className={workspace.formField}
                      placeholder="79.90"
                      inputMode="decimal"
                      value={form.amount}
                      onChange={(event) => updateForm("amount", event.target.value)}
                    />
                    <span className={workspace.fieldHint}>保存时自动转换为分</span>
                  </label>
                  <label className={workspace.fieldGroup}>
                    <span className={workspace.fieldLabel}>积分数量</span>
                    <input
                      className={workspace.formField}
                      type="number"
                      min="1"
                      value={form.credits}
                      onChange={(event) => updateForm("credits", event.target.value)}
                    />
                  </label>
                  <label className={workspace.fieldGroup}>
                    <span className={workspace.fieldLabel}>排序</span>
                    <input
                      className={workspace.formField}
                      type="number"
                      value={form.sort}
                      onChange={(event) => updateForm("sort", event.target.value)}
                    />
                  </label>
                  <label className={clsx(workspace.fieldGroup, workspace.fieldGroupFull)}>
                    <span className={workspace.fieldLabel}>套餐说明</span>
                    <input
                      className={workspace.formField}
                      placeholder="面向用户展示的简短说明"
                      value={form.description}
                      onChange={(event) => updateForm("description", event.target.value)}
                    />
                  </label>
                  <label className={clsx(workspace.fieldGroup, workspace.fieldGroupFull)}>
                    <span className={workspace.fieldLabel}>套餐亮点</span>
                    <textarea
                      className={workspace.formTextarea}
                      placeholder="每行填写一条亮点"
                      value={form.highlights}
                      onChange={(event) => updateForm("highlights", event.target.value)}
                    />
                    <span className={workspace.fieldHint}>每行一条，将展示在前台套餐卡片中</span>
                  </label>
                </div>
              </section>

              <section className={workspace.formSection}>
                <h3 className={workspace.formSectionTitle}>发布设置</h3>
                <div className={workspace.switches}>
                  <label className={workspace.switchRow}>
                    <span>启用套餐</span>
                    <input
                      type="checkbox"
                      checked={form.enabled}
                      onChange={(event) => updateForm("enabled", event.target.checked)}
                    />
                  </label>
                  <label className={workspace.switchRow}>
                    <span>设为推荐套餐</span>
                    <input
                      type="checkbox"
                      checked={form.recommended}
                      onChange={(event) => updateForm("recommended", event.target.checked)}
                    />
                  </label>
                </div>
              </section>

              {message ? <p className={workspace.inlineAlert}>{message}</p> : null}
            </div>

            <footer className={workspace.drawerFooter}>
              <button className={workspace.secondaryAction} type="button" onClick={closeDrawer}>
                取消
              </button>
              <button
                className={workspace.primaryAction}
                type="button"
                disabled={isSaving}
                onClick={savePackage}
              >
                <Save size={15} aria-hidden="true" />
                {isSaving ? "保存中..." : editingId ? "保存修改" : "创建套餐"}
              </button>
            </footer>
          </aside>
        </>
      ) : null}
    </div>
  );
}
