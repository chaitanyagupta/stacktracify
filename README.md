# stacktracify

Have you ever been faced with a stacktrace that looks like this?

```
TypeError h is not a function. (In 'h()', 'h' is undefined) 
    main.jsbundle:954:5353 
    main.jsbundle:112:423 p
    main.jsbundle:112:1740 
    main.jsbundle:112:423 p
    main.jsbundle:112:898 n
    main.jsbundle:112:1273 
    main.jsbundle:50:205 c
    main.jsbundle:50:1623 b
    main.jsbundle:50:488 _
    [native code] value
    [native code] value
```

...perhaps from production from a minified web JS bundle or a React Native error report.

**stacktracify takes a source map and a stack trace from your clipboard (or from a file) and outputs a readable stacktrace with proper line numbers for each line**

Example output:
```
TypeError h is not a function. (In 'h()', 'h' is undefined) 
    at getAuthToken (logic/api.js:67:20)
    at authRequest (logic/api.js:127:8)
    at data (logic/SaveQueue.js:30:20)
    at op (logic/SaveQueue.js:43:29)
    at __callImmediates (node_modules/react-native/Libraries/BatchedBridge/MessageQueue.js:143:11)
```

## Install

```
npm install -g stacktracify
```

## Usage

Pass the minified stacktrace to `stacktracify` via stdin:

```
cat /tmp/crash.txt | stacktracify
```

`stacktracify` will automatically fetch the source maps from the URLs given in the stacktrace.

## See also

- https://github.com/gabmontes/source-map-cli (only takes one line at a time)
- https://github.com/janekp/mapstrace (not a CLI, not easy to use for any stack trace)
