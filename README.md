# PDF Wrap

A high level PDF abstraction library with a rich set of additional features like full text document search. Its primary goal is to provide a simple api to create your own PDF viewer.

Tasty! Isn't it?

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

Consider our documentation for notes on how to deploy the project on a live system.

https://studer-raimann.github.io/pdf-wrap/


### Prerequisites

* Yarn - https://yarnpkg.com/en/docs/install
* Node.js - https://nodejs.org/en/

### Installing

Install dependencies

```
yarn install
```

## Tasks

We use [gulp](https://gulpjs.com/) for all tasks used. We recommend
to not install gulp globally and use the local gulp version.

> local gulp can be accessed with `yarn gulp`

## Running the tests

Run unit tests

```
yarn gulp test
```

### Coding style tests

We use [TSLint](https://palantir.github.io/tslint/) to analysis our code.

```
yarn gulp lint
```

## Built With

* [Typescript](https://www.typescriptlang.org/) - Javascript transpiler used
* [Yarn](https://yarnpkg.com/en/) - Package manager used
* [gulp](https://gulpjs.com/) - Task automating toolkit used
* [Mocha](https://mochajs.org/) - Test framework used

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/studer-raimann/pdf-wrap/tags). 

## Authors

* **Nicolas Märchy** - *Initial work* - [BilledTrain380](https://github.com/BilledTrain380)

See also the list of [contributors](https://github.com/studer-raimann/pdf-wrap/graphs/contributors) who participated in this project.

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE.md](https://github.com/studer-raimann/pdf-wrap/blob/master/LICENSE.md) file for details

## Acknowledgments

* A big fat thank you to Mozilla and their [PDF.js](https://mozilla.github.io/pdf.js/) library which is the main reason this project can exist
