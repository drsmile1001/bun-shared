import { Type as t } from "@sinclair/typebox";

import type { Result } from "~shared/utils/Result";
import type { MaybePromise } from "~shared/utils/TypeHelper";

export interface StructuredInterpreter {
  interpret(
    expr: Expression,
    ctx?: ExecutionContext
  ): Promise<Result<LiteralValue, string>>;
  registerFunction(
    name: string,
    func: (
      ...args: LiteralValue[]
    ) => MaybePromise<Result<LiteralValue, string>>
  ): void;
}

export interface ExecutionContext {
  variables?: { [name: string]: LiteralValue };
  functions?: {
    [name: string]: (
      ...args: LiteralValue[]
    ) => MaybePromise<Result<LiteralValue, string>>;
  };
}

export const literalValueSchema = t.Union([
  t.String(),
  t.Number(),
  t.Boolean(),
  t.Null(),
  t.Record(t.String(), t.Any()),
  t.Array(t.Any()),
]);

export type LiteralValue = typeof literalValueSchema.static;

export const expressionSchema = t.Recursive((node) =>
  t.Union([
    t.Object({
      value: literalValueSchema,
    }),
    t.Object({
      get: t.String({ description: "變數名稱" }),
    }),
    t.Object({
      set: t.String({ description: "變數名稱" }),
      value: node,
    }),
    t.Object({
      op: t.Union([
        t.Literal("eq"),
        t.Literal("ne"),
        t.Literal("gt"),
        t.Literal("ge"),
        t.Literal("lt"),
        t.Literal("le"),
      ]),
      args: t.Tuple([node, node]),
    }),
    t.Object({
      op: t.Union([t.Literal("and"), t.Literal("or")]),
      args: t.Array(node),
    }),
    t.Object({
      op: t.Literal("not"),
      args: t.Tuple([node]),
    }),
    t.Object({
      op: t.Literal("in"),
      args: t.Tuple([node, node]),
    }),
    t.Object({
      op: t.Union([
        t.Literal("add"),
        t.Literal("sub"),
        t.Literal("mul"),
        t.Literal("div"),
        t.Literal("mod"),
      ]),
      args: t.Array(node),
    }),
    t.Object({
      call: t.String({ description: "函數名稱或方法名" }),
      args: t.Array(node),
    }),
    t.Object({
      children: t.Array(node),
    }),
    t.Object({
      if: node,
      then: node,
      else: t.Optional(node),
    }),
  ])
);

export type Expression = typeof expressionSchema.static;
export type LiteralExpression = Extract<Expression, { value: LiteralValue }>;
export function isLiteralExpression(
  expr: Expression
): expr is LiteralExpression {
  return (
    Object.keys(expr).length === 1 &&
    (expr as LiteralExpression).value !== undefined
  );
}
export type GetVariableExpression = Extract<Expression, { get: string }>;
export function isGetVariableExpression(
  expr: Expression
): expr is GetVariableExpression {
  return (expr as GetVariableExpression).get !== undefined;
}
export type SetVariableExpression = Extract<Expression, { set: string }>;
export function isSetVariableExpression(
  expr: Expression
): expr is SetVariableExpression {
  return (expr as SetVariableExpression).set !== undefined;
}
export type OperationExpression = Extract<Expression, { op: string }>;
export function isOperationExpression(
  expr: Expression
): expr is OperationExpression {
  return (expr as OperationExpression).op !== undefined;
}
export type CallExpression = Extract<Expression, { call: string }>;
export function isCallExpression(expr: Expression): expr is CallExpression {
  return (expr as CallExpression).call !== undefined;
}
export type BlockExpression = Extract<Expression, { children: Expression[] }>;
export function isBlockExpression(expr: Expression): expr is BlockExpression {
  return (expr as BlockExpression).children !== undefined;
}
export type IfExpression = Extract<Expression, { if: Expression }>;
export function isIfExpression(expr: Expression): expr is IfExpression {
  return (expr as IfExpression).if !== undefined;
}
