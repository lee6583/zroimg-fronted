"use client";

import { useState } from "react";
import { adminPackagesApi } from "@/api/admin/packages";
import { getErrorMessage } from "@/utils/error";
import type { AdminCreditPackageInput, CreditPackage } from "@/types/orders";

type PackageManagerProps = {
  initialPackages: CreditPackage[];
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

function formFromPackage(packageItem: CreditPackage): PackageForm {
  return {
    code: packageItem.code,
    name: packageItem.name,
    description: packageItem.description,
    amount: (packageItem.amountCent / 100).toFixed(2),
    credits: String(packageItem.credits),
    highlights: packageItem.highlights.join("\n"),
    recommended: packageItem.recommended,
    enabled: packageItem.enabled,
    sort: String(packageItem.sort),
  };
}

function buildInput(form: PackageForm): AdminCreditPackageInput {
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

  function updateForm<Key extends keyof PackageForm>(key: Key, value: PackageForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(packageItem: CreditPackage) {
    setEditingId(packageItem.id);
    setForm(formFromPackage(packageItem));
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
    setMessage("");
  }

  async function savePackage() {
    setMessage("");

    let input: AdminCreditPackageInput;
    try {
      input = buildInput(form);
    } catch (error) {
      setMessage(getErrorMessage(error));
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const data = await adminPackagesApi.update(editingId, input);
        setPackages((current) => {
          return current.map((item) => (item.id === editingId ? data.package : item));
        });
      } else {
        const data = await adminPackagesApi.create(input);
        setPackages((current) => [...current, data.package].sort((a, b) => a.sort - b.sort));
      }

      setMessage("保存成功");
      cancelEdit();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(packageItem: CreditPackage) {
    try {
      const data = await adminPackagesApi.updateStatus(packageItem.id, !packageItem.enabled);
      setPackages((current) =>
        current.map((item) => (item.id === data.package.id ? data.package : item)),
      );
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function toggleRecommend(packageItem: CreditPackage) {
    try {
      const data = await adminPackagesApi.updateRecommend(packageItem.id, !packageItem.recommended);
      setPackages((current) => {
        return current.map((item) => {
          if (item.id === data.package.id) {
            return data.package;
          }
          return data.package.recommended ? { ...item, recommended: false } : item;
        });
      });
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function updateSort(packageItem: CreditPackage, value: string) {
    const sort = Number(value);
    if (!Number.isInteger(sort)) {
      setMessage("排序值必须是整数");
      return;
    }

    try {
      const data = await adminPackagesApi.updateSort(packageItem.id, sort);
      setPackages((current) => {
        return current
          .map((item) => (item.id === data.package.id ? data.package : item))
          .sort((itemA, itemB) => itemA.sort - itemB.sort);
      });
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function deletePackage(packageItem: CreditPackage) {
    const shouldDelete = window.confirm(`确定删除套餐“${packageItem.name}”吗？`);
    if (!shouldDelete) {
      return;
    }

    try {
      await adminPackagesApi.remove(packageItem.id);
      setPackages((current) => current.filter((item) => item.id !== packageItem.id));
      if (editingId === packageItem.id) {
        cancelEdit();
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <div className="grid gap-6">
      <section className="surface rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{editingId ? "编辑积分套餐" : "新建积分套餐"}</h2>
            <p className="mt-1 text-sm text-muted">套餐金额以元填写，保存时转换为后端要求的分。</p>
          </div>
          {editingId ? (
            <button className="btn-secondary" type="button" onClick={cancelEdit}>
              取消编辑
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="field"
            placeholder="套餐编码"
            value={form.code}
            onChange={(event) => updateForm("code", event.target.value)}
          />
          <input
            className="field"
            placeholder="套餐名称"
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
          />
          <input
            className="field"
            placeholder="金额，例如 79.90"
            inputMode="decimal"
            value={form.amount}
            onChange={(event) => updateForm("amount", event.target.value)}
          />
          <input
            className="field"
            placeholder="积分数量"
            type="number"
            min="1"
            value={form.credits}
            onChange={(event) => updateForm("credits", event.target.value)}
          />
          <input
            className="field"
            placeholder="排序值"
            type="number"
            value={form.sort}
            onChange={(event) => updateForm("sort", event.target.value)}
          />
          <input
            className="field"
            placeholder="套餐说明"
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
          />
          <textarea
            className="field min-h-24 md:col-span-2"
            placeholder="套餐亮点，每行一条"
            value={form.highlights}
            onChange={(event) => updateForm("highlights", event.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => updateForm("enabled", event.target.checked)}
            />
            启用套餐
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.recommended}
              onChange={(event) => updateForm("recommended", event.target.checked)}
            />
            设为推荐
          </label>
          <button className="btn-primary" type="button" disabled={isSaving} onClick={savePackage}>
            {isSaving ? "保存中..." : editingId ? "保存修改" : "创建套餐"}
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
      </section>

      <section className="grid gap-3">
        {packages.map((packageItem) => (
          <article key={packageItem.id} className="surface rounded-xl p-4">
            <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{packageItem.name}</h2>
                  <span className="text-xs text-muted">{packageItem.code}</span>
                  {packageItem.recommended ? (
                    <span className="text-xs text-muted">推荐</span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted">{packageItem.description}</p>
              </div>
              <div>
                <p className="font-medium">{packageItem.amountText}</p>
                <p className="mt-1 text-sm text-muted">{packageItem.credits} 积分</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted">排序</span>
                <input
                  className="field w-20"
                  type="number"
                  defaultValue={packageItem.sort}
                  onBlur={(event) => updateSort(packageItem, event.target.value)}
                />
                <span className="text-muted">{packageItem.enabled ? "已启用" : "已停用"}</span>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => startEdit(packageItem)}
                >
                  编辑
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => toggleStatus(packageItem)}
                >
                  {packageItem.enabled ? "停用" : "启用"}
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => toggleRecommend(packageItem)}
                >
                  {packageItem.recommended ? "取消推荐" : "设为推荐"}
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => deletePackage(packageItem)}
                >
                  删除
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
