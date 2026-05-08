# Backchannel Web

Backchannel Frontend App

## Setup

```
npm install
```

## Development

```
npm start
```


## Resources:
- [React Hooks](https://reactjs.org/docs/hooks-intro.html)
- [Typescript](https://basarat.gitbook.io/typescript/getting-started/why-typescript)
- [Firebase](https://www.npmjs.com/package/firebase)
- [Styled-Components](https://styled-components.com/)
- [React Modal](https://www.npmjs.com/package/react-modal)
- [React Toastify](https://fkhadra.github.io/react-toastify/introduction/)
- Redux:
 - [Redux Tool Kit](https://redux-toolkit.js.org/tutorials/typescript) (We use the slices pattern)
 - [Thunks](https://redux-toolkit.js.org/api/createAsyncThunk)
 - [Redux Persist](https://github.com/rt2zz/redux-persist#basic-usage)

 ## App structure
 ```bash
 src
├── api
├── app
├── audio
├── components
├── fonts
├── graphics
├── hooks
├── lib
├── pages
├── shared
├── store
├── styles
├── types
└── util
```
- `src/audio`, `src/graphics`, `src/fonts`: App assets. (_in the future should be moved under `src/assets`_)
- `src/api`: Firebase & eventually backend api abstraction level.
- `src/app`: App entry point
- `src/components`: Reusable components. (note: they should never make use of redux and instead expose onEvent callbacks)
- `src/lib`, `src/util`: Lib is akin to what components are but don't contain jsx. Utils are bits and pieces. (though Imo(sam), utils should be defined in the file they're used if they're one offs) ([Loosely based on this comment](https://github.com/Prismatik/dendritic/issues/159#issuecomment-240288295)). `src/hooks` is akin to lib but follows the hooks pattern for react.
- `src/pages`: All routing and pages live here. We use a fractal-like structure for our pages. With non-reusable components defined in `src/pages/**/components`. These component instead serve the purpose of breaking up complex code into digestible modules.
- `src/store`: Redux.
- `src/styles`: Styling.
- `src/types`: Typescript types.
- `src/shared`: submodule with shared types between our various apps.
