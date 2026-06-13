/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Top-level entry point. Two-phase conversion:
 *
 *   1. Strip `$...$` / `$$...$$` math regions, applying math-mode conversions
 *      (including sub/superscripts) to the inner text. The heuristic for
 *      "this dollar pair is math" runs against the ORIGINAL input so that
 *      model-authored LaTeX is recognised before any tokens are rewritten.
 *
 *   2. Run prose-safe conversions over the remaining text, catching
 *      unwrapped LaTeX tokens (`\alpha`, `\to`, `\textbf{...}`) that the
 *      model emitted outside math delimiters.
 *
 * Short-circuits on input that has no LaTeX markers at all (`\` or `$`) so
 * the hot rendering path stays cheap for ordinary prose.
 */
export declare function convertLatexToUnicode(input: string): string;
