# Web app for Mazed

## Workspaces

- `truthsayer` - web app
- `archaeologist` - browser plugin for Chromium/Chrome
- `elementary` - library of common React components
- `smuggler-api` - simple TS wrapper around smuggler REST API

See [yarn workspaces](https://yarnpkg.com/features/workspaces).

## Docs

For free private repos wiki is not available. Instead there is directory "./docs" in the root of this repo with markdown files.

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


## Universal search features

1. ~~List all the features from MVP project~~
1. Add badge-like columns to MVP project board
2. Assign basic implementation badges (not implemented/works)
3. Assign security badges (secure enough/to be secured)
4. Assign badges that indicate whether or not behaviour is considered acceptable for non-initital users (acceptable/MVP-only)
