# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added
* Close method to pdf document which resolves after the cleanup finished.
* Use pdf link service for internal document links.
* Add scaleTo method which allows scaling to predefined values.

### Fixed
* Filter highlights which are to small to be visible.

### Changed
* Disable background highlight layer because its not visible with colored
document backgrounds.
* pdf document service loadWith now resolves after the viewer is ready instead of instantly after
creation.
* Upgrade to typescript version ^3.1.0
* Enable text selection enhancement.
* Enable WebGL.

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
