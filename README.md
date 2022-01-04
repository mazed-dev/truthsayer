# Web app for Mazed

## Workspaces

- `truthsayer` - web app
- `archaeologist` - browser plugin for Chromium/Chrome
- `elementary` - library of common React components
- `smuggler-api` - simple TS wrapper around smuggler REST API

See [yarn workspaces](https://yarnpkg.com/features/workspaces).

## Docs

- [Labels](./docs/labels.md)

## Development

### Branches

- `main` default release branch

### Build

For to build a single workspace:
```
yarn <workspace> build
```
For instance to build truthsayer only:
```
yarn truthsayer build
```
To build all workspaces:
```
yarn build
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
