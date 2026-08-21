import { visit } from "unist-util-visit";

export function remarkMarkmap() {
  return (tree) => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang !== "markmap" || !parent) return;

      parent.children[index] = {
        type: "mdxJsxFlowElement",
        name: "Markmap",
        attributes: [
          {
            type: "mdxJsxAttribute",
            name: "content",
            value: jsStringLiteralAttribute(node.value),
          },
        ],
        children: [],
      };
    });
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
