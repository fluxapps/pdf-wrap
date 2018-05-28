# PDF Wrap Reference Documentation

**Authors**

Nicolas Märchy

**Version 0.0.1**

Copyright &copy; 2018 studer + raimann ag, <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike 4.0 International License</a>.

---

# Getting Started

## Requirements

* Target language level: ES5
* Module: commonjs

If you have to use a lower target language level you have
to transpile the code yourself (e.g. with [Babel](https://babeljs.io/)).

## Installing

PDF Wrap can be installed with npm or yarn.

### Yarn Install

```shell
yarn add pdf-wrap
```

### NPM Install

```npm
npm i pdf-wrap
```

### Manual Installation

You can download the PDF Wrap distribution from the npm repository.

* [pdf-wrap.tar.zip](https://www.npmjs.com/)

# Using PDF Wrap

This section goes into more detail about how you should use PDF Wrap.
It covers topics such as using the api, toolbox and how to provide your storage.

## Provide your storage adapter

In order to use PDF Wrap, you must provide a storage adapter. A storage adapter
is used to store and load PDF annotations.

```typescript
export class MyStorageAdapter implements StorageAdapter {
    
    register(): URI {
        return URI.from("file://");
    }
    
    start(events: PageEventCollection): void {
        // listen on events
    }
    
    loadPage(pageNumber: number): Promise<PageOverlay> {
        // load page data
    }
}
```

You have to implement three methods: `register`, `start` and `loadPage`.

### `register`

The schema of the returned `URI` determines if your storage provider is used or not.
Which schema is used to load a PDF must be defined when the PDF is loaded.

Read more about how to load a PDF: [Using the PDF Document Service](#using-the-pdf-document-service)

### `start`

Will be invoked when your storage provider is used. It'll provide a event collection,
where you can listen to store the different annotations made on a PDF page.

Each event is a hot `Observable` which emits specific objects.

* `afterPolyLineRendered` - Emits a `DrawElement` with the rendered `PolyLine` information.
* `afterRectangleRendered` - Emits a `DrawElement` with the rendered `Rectangle` information.
* `afterElementRemoved` - Emits a `DrawElement` with the `Element` information which was removed.

> A `DrawEvent` contains a `layer` and a `pageNumber` property which you should store as well,
because you have to provide highlights and drawings separated in your `loadPage` method.
The `layer` property is either `PageLayer.HIGHLIGHT` or `PageLayer.DRAWING`.

### `loadPage`

You have to provide the page information to the given `pageNumber`.
Highlights and drawings are separated. In order to build the different elements
you should use the `ElementBuilderFactory` class.

```typescript
async loadPage(pageNumber: number): Promise<PageOverlay> {
    
    // load your page information
    
    return new PageOverlay(
        pageNumber,
        [...], // your highlights
        [...] // your drawings
    )
}
```

Read more about how to build elements: [Using the ElementBuilderFactory](#using-the-`elementbuilderfactory`)

### Add your storage adapter to the `StorageRegistry`

In order to provide your storage adapter to PDF Wrap you have to add it
to the `StorageRegistry`.

The `StorageRegistry` is a singleton where you can add as many storage adapters as you want.

```typescript

StorageRegistry.instance
    .add(new MyStorageAdapter())
    .add(new MyStorageadapter2());

```

### Skippable Storage Adapter

You can provide multiple storage adapters for the same URI schema. When the events from
the `start` method are fired, every storage adapter will be used to store the data.
But when the PDF is loaded only one storage adapter can be used.

Usually the first storage adapter will be used. But you can make your storage adapter skippable.
This can be useful, if you want to load the data, but in case it'll fail, delegate
to the next storage adapter.

To make your storage adapter skippable extend the abstract class `SkippableStorageAdapter`.

```typescript
export class MySkippableStorageAdapter extends SkippableStorgaeAdapter {
    
    ... // other methods
        
    loadPage(pageNumber: number): Promise<PageOverlay> {
        
        try {
            // load page data   
        } catch (error) {
            this.skip();
        }        
    }
}
```

The `skip` method will abort the loading process of this adapter and continues with the next available adapter.

## Using the `ElementBuilderFactory`

In order to create elements used in a `StorageAdapter` you should use the
`ElementBuilderFactory`.

```typescript

const elementBuilder: ElementBuilderFactory = new ElementBuilderFactoryImpl();

const polyLine: PolyLine = elementBuilder.polyLine()
    .id("some-id")
    .borderColor(colorFromHex("000000"))
    .coordinates([{x: 47.51, y: 201.45}, {x: 48.8, y: 202.02}])
    .build();

```

### Using colors

To use colors on the elements you can use the `Color` type. To create a `Color`
use one of the following functions.

* `colorFrom`
* `colorFromHex`
* `colorFromRgba`

> There are predefined colors with the `Colors` enumerator available.

If you're looking for valid values of these functions, please consider the typedoc [API](api).

## Using the toolbox

## Using the PDF Document Service

# PDF Wrap Features

## Search Feature

## Outline Feature

## Page Thumbnails