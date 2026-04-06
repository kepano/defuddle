```json
{
  "title": "Sample Plugin",
  "author": "",
  "site": "",
  "published": ""
}
```

## sample-plugin

A fast and flexible plugin for editing configuration files.

## Features

- Written in `Lua`
- Asynchronous execution
- Buffer locking
- Opt-in default configurations
- Conditional formatting
- Before/after hooks

## Install

Use your preferred package manager:

```
use 'user/sample-plugin'
```

## Configuration

The plugin can be configured by passing a table to the setup function. Below is an example with the default values.

```
require('sample-plugin').setup({
  logging = true,
  filetype = {},
})
```

## Usage

The plugin provides a single command to format the current buffer. Run it manually or bind it to a key.