#!/usr/bin/env node
'use strict';
const meow = require('meow');
const stackTraceParser = require('stacktrace-parser');
const fs = require('fs-extra');
const { SourceMapConsumer } = require('source-map');
const fetch = require('node-fetch');

const sourceMapConsumers = {}
async function getSourceMapConsumerForFile(file) {
  let smc = sourceMapConsumers[file];
  if (smc) {
    return smc;
  }
  // FIXME: this just assumes that relative to a URL, the source map is available at URL.map. Ideally we should read this
  // from the source js file's sourceMappingURL that's present in the last line as a comment
  const response = await fetch(file + '.map');
  const text = await response.text();
  const content = JSON.parse(text)
  smc = await new SourceMapConsumer(content);
  sourceMapConsumers[file] = smc;
  return smc;
}


const cli = meow(`
  Usage
    $ stacktracify <map-path>

  Options
    --file, -f  (default is read from clipboard)

  Examples
    $ stacktracify /path/to/js.map --file /path/to/my-stacktrace.txt
`, {
  flags: {
    file: {
      type: 'string',
      alias: 'f',
    },
  },
});


const { file } = cli.flags;

(async () => {
  try {
    let str;
    if (file !== undefined) {
      str = fs.readFileSync(file, 'utf-8');
    } else {
      str = fs.readFileSync(0, 'utf-8')
    }

    let [header, ...lines] = str.trim().split(/\r?\n/);

    lines = lines.map((line) => {
      // stacktrace-parser doesn't seem to support stacktrace lines like this:
      // index-12345678.js:1:2 a
      const match = line.match(/^(\s+)([^\s]+:\d+:\d+)\s+([^\s]+)$/);
      if (match) {
        return `${match[1]}at ${match[3]} (${match[2]})`;
      }

      return line;
    })

    const stack = stackTraceParser.parse(lines.join('\n'));
    if (stack.length === 0) throw new Error('No stack found');

    if (header) console.log(header);

    for (const {file, methodName, lineNumber, column} of stack) {
      try {
        if (lineNumber == null || lineNumber < 1) {
          console.log(`    at ${methodName || '[unknown]'}`);
        } else {
          const smc = await getSourceMapConsumerForFile(file);
          const pos = smc.originalPositionFor({ line: lineNumber, column });
          if (pos && pos.line != null) {
            console.log(`    at ${pos.name || methodName || '[unknown]'} (${pos.source}:${pos.line}:${pos.column})`);
          }

          // console.log('src', smc.sourceContentFor(pos.source));
        }
      } catch (err) {
        console.log(`    at FAILED_TO_PARSE_LINE`);
      }
    }
  } catch (err) {
    console.error(err);
  }
})();
