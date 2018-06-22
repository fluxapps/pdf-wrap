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
It covers topics such as using the api, toolbox and how to provide your storage adapter.

## Setup HTML

In order to use PDF Wrap properly you have to setup a minimalistic html.

### Styles

In order to display the PDF properly you should include the following css file.

* <pdf-wrap-root>/assets/css/pdf-wrap.css

### HTML container

You have to setup a html container in a specific way.

```html
<div class="pdf viewport">

        <div class="pdf-container">
            <div class="pdfViewer"></div>
        </div>

</div>
```

Where the `div` with the class `pdf viewport` is your viewport. It is an absolute
positioned `div` which will consume the entire area of its relative positioned parent.
So either wrap it with another `div` which is aligned like you want it,
or override the `pdf viewport` css styles. Anyway, make sure `pdf viewport` has
a fix height, otherwise some features of PDF Wrap will not work.

## Setup PDF.js

Because PDF Wrap uses [PDF.js](https://mozilla.github.io/pdf.js/) under the hood,
you have to provide the `pdf.worker.js` as well as some cMaps.

The `pdf.worker.js` and the cMaps are delivered in the `assets` directory of PDF Wrap.

Depending on how you build your project, either copy they to a directory of your choice or provide them
somehow as resources.

Either way you can set the worker and cMap url

```typescript
setWorkerSrc("assets/libs/pdf-wrap/pdf.worker.js");
setMapUrl("assets/libs/pdf-wrap/cMaps");
```

In this case, we assuming, that the `pdf.worker.js` and the cMaps are
inside the `assets/libs/pdf-wrap` directory of the built project.

## Setup Logger

PDF Wrap has a default log configuration which logs everything from log level `Warn`.

You can override the default config

```typescript
LoggerFactory.configure({
    logGroups: [
        {
            logger: "ch/studerraimann/pdfwrap",
            logLevel: LogLevel.Trace
        }
    ]
});
```

Each log group object accepts the property `logger` and `logLevel`.
It allows you to define different log levels for different directories, files or even classes.

---

`logger` defines which directory, file class or function should be used

**The string pattern scheme:**

`ch/studerraimann/pdfwrap/<directory name>/<file name>:<class or function name>`

* `ch/studerraimann/pdfwrap` - must be part of every logger
* `/<directory name>` - can be any directory structure inside the `src` directory of the PDF Wrap source code
* `/<file name>` - can be any file name (without extension) inside the specified directory name
* `:<class or function name>` - can be any class or function name inside the specified file name

**Example**

* `ch/studerrraimann/pdfwrap/pdfjs` - for everything inside this directory
* `ch/studerraimann/pdfwrap/pdfjs/highlight` - for everything inside this file
* `ch/studerraimann/pdfwrap/pdfjs/highlight:TextHighlighting` - for the class `TextHighlighting` of the file `highlight`

---

`logLevel` defines one of the log level to use on this group

If you are using Typescript you can use the `typescript-logging` enumerator `LogLevel`.

If you are using Javascript you have to use the index number which represents the log level of the enumerator:

* 0 - trace
* 1 - debug
* 2 - info
* 3 - warn
* 4 - error
* 5 - fatal

## Using the PDF Document Service

The `PDFDocumentService` is your entry point to PDF Wrap. It provides a load method
to load and display your PDF file.

Create an instance of a `PDFDocumentService`

```typescript
const documentService: PDFDocumentService = new PDFjsDocumentService();
```

> Note that `PDFDocumentService` is the interface and `PDFjsDocumentService` is an implementation of it.

Load your PDF file

```typescript
documentService.loadWith({
    container: document.getElementById("viewerContainer"),
    pdf: "assets/resources/chicken.pdf",
    layerStorage: URI.from("file://my-pdf")
}).then(pdf => {
    // you'll get a PDFDocument instance
});
```

Options:

* container: your div with the `pdf-container` class.
* pdf: a `Blob` representing your PDF file.    
* layerStorage: an `URI` to use for the storage adapter

Learn more about the [StorageAdapter](#provide-your-storage-adapter)

### LayerStorage Example

We assume

* the `layerStorage` is "mem://my-pdf"
* the registered storage adapter scheme is "mem://"

```typescript
// load the document
documentService.loadWith({
    container: document.getElementById("viewerContainer"),
    pdf: "assets/resources/my-pdf.pdf",
    layerStorage: URI.from("mem://my-pdf")
}).then(pdf => {
    // you'll get a PDFDocument instance
});

// the storage adapter will get the full URI
export class MyStorageAdapter implements StorageAdapter {
    
    register(): URI {
        return URI.from("mem://"); // we only provide the same scheme
    }
    
    start(uri: URI, events: PageEventCollection): void {
        // uri is mem://my-pdf
    }
    
    loadPage(uri: URI, pageNumber: number): Promise<PageOverlay> {
        // uri is mem://my-pdf
    }
}
```

It is important to know, that for the `register` method, only the URI scheme is considered.
Where in the `start` and `loadPage` method, the full URI used by the `loadWith` method is provided.
Otherwise, you would not be able to store different PDFs with the same Adapter.

## Using the toolbox

Once you have loaded the PDF, you can access its toolbox.

The toolbox contains the following tools:

* Freehand - to draw with the mouse on a PDF page
* Eraser - to remove drawings made with the Freehand tool

```typescript
pdf.toolbox.freehand; // get the freehand tool instance
pdf.toolbox.eraser; // get the eraser tool instance
```

All tools can be activated, deactivated or toggled

```typescript
pdf.toolbox.freehand.activate();
pdf.toolbox.freehand.deactivate();
pdf.toolbox.freehand.toggle();
```

All tools provide the current state through a property

```typescript
const isFreehandActive: boolean = pdf.toolbox.freehand.isActive;
```

All tools provide an `Observable` which emits the new state in case of a state change

```typescript
pdf.toolbox.freehand.stateChange
    .subscribe(state => {
        if (state.isActive) {
            ...
        } else {
            ...
        }
    })
```

### Freehand

**Limitations:**

* The Freehand tool can **not** draw over multiple PDF pages at once
* The Freehand tool does **not** work with touchscreen

The Freehand tool as additional setters:

* `setColor` - accepts a `Color` instance and defines the color of the stroke
* `setStrokeWidth` - accepts a number in px and defines the width of the stroke

These setters can be chained

```typescript
pdf.toolbox.freehand
    .setColor(colorFromHex("#000"))
    .setStrokeWidth(2);
```

Learn more about colors: [Using colors](#using-colors)

### Eraser

The Eraser can only remove strokes made with the Freehand tool.

In order to remove a stroke, the eraser tool needs to be activated
and the stroke needs to be crossed with the mouse while the mouse is pressed.

## Using the highlighting

**Limitations:**

* The highlight feature can **not** highlight text over multiple PDF pages at once.

Once you have loaded the PDF, you can use its highlighting feature.

The highlighting feature is disabled by default. You have to enable it if you want to provide it to your users.

Enable highlighting

```typescript
pdf.highlighting.enable();
```

This will register several event listeners in order to enable the highlighting feature.

To actually highlight a text selection you have to use the `onTextSelection` Observable.
It'll will emit a `TextSelection` instance, whenever a text selection is performed by the user.

In contrast to the `onTextSelection`, the `onTextUnselection` Observable emits
whenever a text selection is cleared.

```typescript
pdf.highlighting.onTextSelection
    .subscribe(textSelection => {
        // use the textSelection here
    });

pdf.highlighting.onTextUnselection
    .subscribe(() => {
        // disable button
    })
```

This can be useful, if you want to enable or disable a button to highlight or to clear the text selection.

The `TextSelection` instance provides a `clearHighlight` and a `highlight` method.

* `clearHighlight` will remove any highlight of the selected text
* `highlight` accepts a `Color` instance and highlights the selection with it

Learn more about colors: [Using colors](#using-colors)

> PDF Wrap only adds or remove event listeners for the text selection.
It does not actually disable the text select feature from a html page. If you want
to disable it, you have to disable or enable it
yourself through [CSS](https://css-tricks.com/almanac/properties/u/user-select/).

## Provide your storage adapter

In order to use PDF Wrap, you must provide a storage adapter. A storage adapter
is used to store and load PDF annotations.

```typescript
export class MyStorageAdapter implements StorageAdapter {
    
    register(): URI {
        return URI.from("file://");
    }
    
    start(uri: URI, events: PageEventCollection): void {
        // listen on events
    }
    
    loadPage(uri: URI, pageNumber: number): Promise<PageOverlay> {
        // load page data
    }
}
```

You have to implement three methods: `register`, `start` and `loadPage`.

---

`register`

The schema of the returned `URI` determines if your storage provider is used or not.
Which schema is used to load a PDF must be defined when the PDF is loaded.

Read more about how to load a PDF: [Using the PDF Document Service](#using-the-pdf-document-service)

---

`start`

Will be invoked when your storage provider is used. It'll provide the URI and a event collection,
where you can listen to store the different annotations made on a PDF page.

Each event is a hot `Observable` which emits specific objects.

* `afterPolyLineRendered` - Emits a `DrawElement` with the rendered `PolyLine` information.
* `afterRectangleRendered` - Emits a `DrawElement` with the rendered `Rectangle` information.
* `afterElementRemoved` - Emits a `DrawElement` with the `Element` information which was removed.

A `DrawEvent` contains a `layer` and a `pageNumber` property which you should store as well,
because you have to provide highlights and drawings separated in your `loadPage` method.
The `layer` property is either `PageLayer.HIGHLIGHT` or `PageLayer.DRAWING`.

---

`loadPage`

You have to provide the page information to the given `pageNumber`.
Highlights and drawings are separated. In order to build the different elements
you should use the `ElementBuilderFactory` class.

```typescript
async loadPage(uri, URI, pageNumber: number): Promise<PageOverlay> {
    
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

### Empty Storage Adapter

If you don't want to provide a `StorageAdapter` you can register an `EmptyStorageAdapter` instance

```typescript
StorageRegistry.instance
    .add(new EmptyStorageAdapter(URI.from("ex://")));
```

> You should only provide the `EmptyStorageAdapter` if you are not using the toolbox or highlighting at all.

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

# PDF Wrap Features

## Search

PDF Wrap provides a full text search over a PDF document. To access the `DocumentSearch`
you have to load a PDF.

Once you have loaded the PDF, you can access the `SearchDocument`

```typescript
pdf.searchController;
```

A `DocumentSearch` provides you with different methods:

* `search` - to start a search against a term
* `previous` - to select the previous search result found by `search`
* `next` - to select the next search result found by `search`

The `search` methods accepts two parameters, `query` and `options`
where `query` is self explained and `options` are different flags for the search.

* `searchPhrase` - if `true` the search term will be used as a phrase, otherwise as a term
* `fuzzy` - if `true` the search operation is performed case insensitive, otherwise case sensitive
* `highlightAll` - if `true` highlights all search results, otherwise only the active selected

### Example Search

```typescript
pdf.searchController.search("example", {
    highlightAll: true,
    searchPhrase: false,
    fuzzy: true});
```

## Outline

You can access the outline of a PDF once the PDF is loaded

```typescript
pdf.getOutline().then(outline => {
    // use the outline
})
```

The `Outline` class provides two different forms of the outline.
The `flatList` and the `tree` structure, where the `flatList` means, that
even nested outlines are at the top level.
The `tree` structure remains in the nested structure of the PDF outline.

Each outline provides the `title` as well as the `pageNumber`

```typescript
// use with flat list
pdf.getOutline().then(outline => {
    outline.flatList.forEach(item => {
        item.title;
        item.pageNumber;
    });
});

// use tree with children
pdf.getOutline().then(outline => {
    outline.tree.forEach(item => {
        item.title;
        item.pageNumber;
        item.children; // nested outlines
    });
});
```

You want to jump to the page where the outline points to? Check out [Page Navigation](#page-navigation)

## Page Thumbnails

You can access thumbnails of the PDF pages once the PDF is loaded

```typescript
// get the thumbnail of page 1, 2 and 3 with a max size of 96px
pdf.getThumbnails(96, 1, 2, 3).subscribe(thumbnail => {
    // use the thumbnail
});
```

The `getThumbails` method returns an `Observable` which emits every thumbnail after another.
Once the last thumbnail is loaded, the `Observable` completes.

* The first parameter `maxSize` defines the max size, a thumbnail can be.
* The second parameter `pageNumbers` is a vararg for the page number you want the thumbnail of.

*Tip: If you want to get the thumbnail of all pages, use a while loop to get all page numbers of the document*

```typescript
const pages: Array<number> = []; while (pages.length < pdf.pageCount) pages.push(pages.length + 1);
```

## Page Navigation

You can switch to a page by simply setting the `currentPageNumber` property of the `PDFDocument`

```typescript
pdf.currentPageNumber = 5;

// next page
pdf.currentPageNumber = pdf.currentPageNumber + 1;

// previous page
pdf.currentPageNumber = pdf.currentPageNumber - 1;
```

## Zoom

You can zoom in or zoom out by simply setting the `scale` property of the `PDFDocument`

```typescript
pdf.scale = pdf.scale * 1.5; // will zoom in by 150%
pdf.scale = pdf.scale / 1.5; // will zoom out by 150%

// or set a fix zoom value
pdf.scale = 1.5; // will zoom to 150%
```

# Miscellaneous

## Using colors

Whenever a color can be set in PDF Wrap, a `Color` instance is required.

To create a `Color` instances use one of the following functions.

Module: `api/draw/color`

* `colorFrom`
* `colorFromHex`
* `colorFromRgba`

> There are predefined colors with the `Colors` enumerator available.

If you're looking for valid values of these functions, please consider the typedoc [API](api).
