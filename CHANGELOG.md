# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.3.7 - 2019-07-20
### Changed
* Form z axis handling improved.

## 0.3.6 - 2019-07-15
### Fixed
* Forms and drawings which have been dragged + rotated are no correctly drawn
after a document reload.

## 0.3.5 - 2019-07-12
### Changed
* Rollback to pdfjs version 2.0.943.

## 0.3.4 - 2019-07-12
### Fixed
* Form rotation is now properly supported.
* Add missing tslib dependency.

### Changed
* Update pdfjs-dist to version 2.1.266.
* Update typescript to version 3.5.

## 0.3.3 - 2019-06-12
### Fixed
* Fix form resize bug introduced in 0.3.2.

## 0.3.2 - 2019-06-12
### Fixed
* Selection change events are now correctly emitted on selection change instead of onclick.
* Selection changes are now correctly emitted after element removal.

## 0.3.1 - 2019-06-04
### Added
* Library entry point defined in package.json
### Changed
* Rxjs@^6 is now a peer dependency.
* Module `pdfjs.document.service` does no longer export internal class `PDFjsDocument`
* typedoc library updated (^0.14.2)
* The typetoc is now only generated for the public parts of the Library.  
### Fixed
* Forms and drawings are now painted in the correct order, 
after document resize events.

## 0.3.0 - 2019-06-02
### Added
* Forms api which can be used to place rectangles, lines, circles and ellipses
in a document.
* Selection tool which allows to transform existing forms and drawings.
### Changed
* Upgrade to typescript version ^3.4.0
* Engines version constraint (node 10.9 < 13.0, yarn 1.13 < 2.0)
* Migrate to Gulp 4.
* Updated dev example
* Migrate from uglify-js to terser in order to target es2015.
* Only one tool can be active at once.
* Default to highlighting mode if no tool is active.
* **BREAKING CHANGES**
    * The event PageEventCollection#afterRectangleRendered() has
    been renamed to PageEventCollection#afterHighlightRendered().
    * The Points of all elements now expect to have a x,y and z field.
    * Target es2015.

## 0.2.0 - 2019-01-18

### Added
* Close method to pdf document which resolves after the cleanup finished.
* Use pdf link service for internal document links.
* Add scaleTo method which allows scaling to predefined values.
* Add isEnabled getter to highlight interface.
* Experimental touch support for drawing tools.
* Engines version constraint (node 10.9 - 10.x, yarn 1.12 - 1.14)
* Max picture size constraint to 4096^2.

### Fixed
* Filter highlights which are to small to be visible.
* Recalculate height of highlights to really fit the element instead of the selection (webkit & blink).
* Page number detection while drawing with freehand tool.
* Eraser tool now stops removing lines after mouse up.
* Freehand tool now scales lines according to document scale.

### Changed
* Disable background highlight layer because its not visible with colored
document backgrounds.
* pdf document service loadWith now resolves after the viewer is ready instead of instantly after
creation.
* Upgrade to typescript version ^3.1.0
* Enable text selection enhancement.
* Enable WebGL.
* Upgrade pdfjs to 2.0.943.
* Update example (dev-viewer).
* The freehand touchscreen support is now mentioned in the documentation. 

### Removed
* Documentation about first highlight layer which is no longer implemented.

## 0.1.3 - 2018-08-23

### Fixed
* Version number problem with npm.js.

## 0.1.2 - 2018-08-23

### Fixed
* Highlight remove observable

## 0.1.1 - 2018-08-14

### Fixed
* Package name and Scope

## 0.1.0 - 2018-08-14

### Added
* Color module
* Drawable elements
* Element builders
* Element painters
* Storage adapter api
* Toolbox
    * Freehand - to draw with the mouse
    * Eraser - to erase drawings
* Text highlighting
* Logger configuration
* PDF Outline parsing
* Zoom value
* Page Navigation
* PDF thumbnails
