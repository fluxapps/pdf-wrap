# PDF Wrap Dev Viewer

This example is mainly used for development. The PDF Wrap version used in this project
will just be linked to the build output of PDF Wrap and not installed via npm.

## Getting Started

### Prerequisites

* Yarn - https://yarnpkg.com/en/docs/install
* Node.js - https://nodejs.org/en/

### Installing

You have to link the PDF Wrap build output to this project.

First, make sure PDF Wrap is built for npm

In the PDF Wrap root directory

```
yarn gulp repackage
```

Go to PDF Wrap build directory and link the project with yarn

```
cd path/to/pdf-wrap/build/distributions/npm
yarn link
```

Go to this projects root directory and add PDF Wrap with yarn link

```
cd path/to/pdf-wrap/examples/dev-viewer
yarn link pdf-wrap
```

Now PDF Wrap is linked to this project and you can install all other dependencies

```
yarn install
```

## Development

Start this project

```
yarn run start
```

This will run a light sever to host the `build/www` directory.

Go to [http://localhost:4000](http://localhost:4000/)

If you make changes in the PDF Wrap source code, just build the project again.

In the PDF Wrap root directory

```
yarn gulp repackage
```
