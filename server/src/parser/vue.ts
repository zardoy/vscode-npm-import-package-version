import Vue = require("@vue/component-compiler-utils");
import { IMark } from "../type";
import { compile as TypescriptCompiler } from "./typescript";

export function compile(code: string, filepath: string): IMark[] {
  const parser: typeof Vue = require("@vue/component-compiler-utils");
  const output = parser.parse({
    source: code,
    filename: filepath,
    compiler: require("vue-template-compiler")
  });

  const script = output.script;

  if (!script) {
    return [];
  }

  const lang = script.lang;

  const arr = code.split("\n");
  let offset = 0;
  let beforeLine = 0;

  for (let line = 1; line < arr.length; line++) {
    const lineStr = arr[line - 1];

    const start = offset;

    offset += lineStr.length + 1;

    const end = offset;

    /**
     * eg.
     *
     * <script>
     *  import koa from 'koa
     * </script>
     *
     * or.
     * <script>require('koa')
     * </script>
     */
    if (start === script.start + 1) {
      beforeLine = line;
    } else if (start < script.start + 1 && end > script.start) {
      beforeLine = line - 1;
      break;
    }
  }

  const contentArr = script.content.split("\n");

  for (let i = 0; i < beforeLine; i++) {
    contentArr.shift();
  }

  const content = contentArr.join("\n");

  let marks: IMark[] = [];

  switch (lang) {
    case "typescript":
    case "ts":
    case "tsx":
    case "javascript":
    case "js":
    case "jsx":
      marks = TypescriptCompiler(content, filepath);
      break;
    default:
  }

  return marks.map(v => {
    v.location.start = script.start + v.location.start;
    v.location.end = script.start + v.location.end;
    return v;
  });
}
