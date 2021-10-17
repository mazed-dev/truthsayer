# Web app for Mazed

## Workspaces

- `truthsayer` - Web app
- `archaeologist` - browser plugin for Chromium/Chrome
- `smuggler-api` - simple TS wrapper around smuggler REST API

See [yarn workspaces](https://yarnpkg.com/features/workspaces).

## Docs

For free private repos wiki is not availiable. Instead there is directory "./docs" in the root of this repo with mardown files.

## Development

### Branches

- `main` default release branch

### Build

For to build a single workspace:
```
yarn <workspace> build
```

### Test

To test all workspaces run:
```
yarn test
```

To test one workspace:
```
yarn <workspace> test
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
