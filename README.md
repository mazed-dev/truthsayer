# Web app for Mazed

## Projects

- `truthsayer` - Web app
- `archaeologist` - browser plugin for Chromium/Chrome
- `smuggler-api` - simple TS wrapper around smuggler REST API

## Docs

For free private repos wiki is not availiable. Instead there is directory "./docs" in the root of this repo with mardown files.

## Development

### Branches

- `main` default release branch

### Build

To build all workspaces run:
```
yarn build
```

For to build a single workspace:
```
yarn truthsayer build
```

### Test

To test all workspaces run:
```
yarn test
```

To test one workspace:
```
yarn <project> test
```

### Linter

To run linter auto fix for all workspaces:
```
yarn fix
```

To run a quick prettier fix (without linter):
```
yarn fix:prettier
```
