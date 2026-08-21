import { visitParents } from "unist-util-visit-parents";
import { toString } from "mdast-util-to-string";

const HEADING_DEPTHS = new Set([1, 2, 3, 4]);

export function remarkMermaidFrame() {
  return (tree) => {
    const targets = [];

    visitParents(tree, "code", (node, ancestors) => {
      if (node.lang !== "mermaid") return;
      targets.push({ node, ancestors: [...ancestors] });
    });

    for (const { node, ancestors } of targets) {
      const parent = ancestors[ancestors.length - 1];
      const index = parent.children.indexOf(node);
      if (index === -1) continue;

      const title = findPrecedingHeading(tree, node) ?? "Sơ đồ luồng";

      parent.children[index] = {
        type: "mdxJsxFlowElement",
        name: "MermaidFrame",
        attributes: [
          {
            type: "mdxJsxAttribute",
            name: "chart",
            value: jsStringLiteralAttribute(node.value),
          },
          {
            type: "mdxJsxAttribute",
            name: "title",
            value: title,
          },
        ],
        children: [],
      };
    }
  };
}

function jsStringLiteralAttribute(value) {
  return {
    type: "mdxJsxAttributeValueExpression",
    value: JSON.stringify(value),
    data: {
      estree: {
        type: "Program",
        sourceType: "module",
        body: [
          {
            type: "ExpressionStatement",
            expression: {
              type: "Literal",
              value,
              raw: JSON.stringify(value),
            },
          },
        ],
      },
    },
  };
}

function findPrecedingHeading(tree, target) {
  let lastHeading = null;
  let found = false;

  (function walk(node) {
    if (found) return;
    if (node === target) {
      found = true;
      return;
    }
    if (node.type === "heading" && HEADING_DEPTHS.has(node.depth)) {
      lastHeading = toString(node).trim();
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        walk(child);
        if (found) return;
      }
    }
  })(tree);

  return lastHeading;
}
