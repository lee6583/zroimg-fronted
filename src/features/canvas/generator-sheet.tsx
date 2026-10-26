"use client";

import { useTranslations } from "next-intl";
import { Sheet } from "@/components/ui/sheet";
import { getMode, getUpstreamImage } from "./canvas-model";
import { useCanvasStore } from "./canvas-store";
import { GeneratorForm, GeneratorStatus } from "./nodes/generator-node";
import styles from "./canvas-editor.module.css";

type GeneratorSheetProps = {
  nodeId: string | null;
  onClose: () => void;
};

/** 手机端编辑生成节点：画布缩小后节点内的表单无法操作，改在底部 Sheet 中编辑。 */
export function GeneratorSheet(props: GeneratorSheetProps) {
  const nodeId = props.nodeId;
  const onClose = props.onClose;
  const tMode = useTranslations("generate.modes");
  const node = useCanvasStore((state) => {
    const found = state.nodes.find((item) => item.id === nodeId);
    return found?.type === "generator" ? found : null;
  });
  const upstream = useCanvasStore((state) => {
    return nodeId ? getUpstreamImage(nodeId, state.nodes, state.edges) : null;
  });

  let title = "";
  if (node) {
    title = tMode(getMode(node.data, upstream));
  }

  return (
    <Sheet
      open={Boolean(node)}
      onClose={onClose}
      title={
        node ? (
          <span className={styles.generatorSheet__title}>
            {title}
            <GeneratorStatus data={node.data} />
          </span>
        ) : null
      }
    >
      {node ? (
        <div className={styles.generatorSheet}>
          <GeneratorForm id={node.id} data={node.data} variant="sheet" />
        </div>
      ) : null}
    </Sheet>
  );
}
