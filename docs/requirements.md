---
title: Requirements
sidebar_position: 1.1
---

This package requires:

- PHP 8.4 or higher
- Laravel 12 or 13
- [javaabu/forms](https://github.com/Javaabu/forms) v2, for the Blade field (installed with the package)
- [javaabu/manifest](https://github.com/Javaabu/manifest), which ships the editor's CSS and JavaScript to your app (installed with the package)
- [javaabu/stencil](https://github.com/Javaabu/stencil), for the stencil field (installed with the package)
- [symfony/html-sanitizer](https://symfony.com/doc/current/html_sanitizer.html) (installed with the package)

The editor's JavaScript is built by your app's Vite through manifest, so your app installs its npm dependencies: TipTap 3, [@javaabu/onu](https://www.npmjs.com/package/@javaabu/onu), React 19 (Onu's editor module imports it, so Blade apps need it too). `php artisan manifest:check` lists what's missing. Apps that don't build with Vite get the prebuilt editor from the package's `dist` folder.

For Inertia React pages:

- React 19
- [@javaabu/forms](https://github.com/Javaabu/react-forms), for `BlockEditorField` (`manifest:check` asks for it only in apps with an Inertia adapter)
- manifest's Vite plugin, which lets your app import `@javaabu/block-editor`
