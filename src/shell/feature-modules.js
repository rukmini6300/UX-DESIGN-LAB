/* =========================================================================
   FEATURE MODULES
   Optional features that load the first time they are needed, so the
   design system starts fast and each feature lives in its own folder
   under src/modules/.

   A module has a manifest (its file list, for the multi-file build) and,
   in the single-file build, an inert <script type="text/plain"
   id="kg-module-NAME"> block written by build.js. Its last file calls
   registerFeatureModule(NAME, api).

   Provides: FEATURE_MODULES, defineFeatureModule, registerFeatureModule,
   loadFeatureModule, lazyRoute
   ========================================================================= */
'use strict';

/** name -> { files, api, loading } */
const FEATURE_MODULES = {};

/**
 * Declares a module and the files it is made of (load order).
 * @param {string} name   folder name under src/modules/
 * @param {string[]} files
 */
function defineFeatureModule(name, files) {
  FEATURE_MODULES[name] = { files, api: null, loading: null };
}

/** Called once by the module's last file. */
function registerFeatureModule(name, api) {
  FEATURE_MODULES[name].api = api || {};
}

/**
 * Loads a module once and resolves with its api.
 * Single-file build: runs the inline block. Multi-file build: loads each file in order.
 */
function loadFeatureModule(name) {
  const mod = FEATURE_MODULES[name];
  if (!mod) return Promise.reject(new Error('Unknown module: ' + name));
  if (mod.api) return Promise.resolve(mod.api);
  if (!mod.loading) {
    const inline = document.getElementById('kg-module-' + name);
    const run = inline
      ? Promise.resolve().then(() => runInlineScript(inline.textContent))
      : mod.files.reduce((chain, src) => chain.then(() => loadScript(src)), Promise.resolve());
    mod.loading = run
      .then(() => {
        if (!mod.api) throw new Error('The ' + name + ' module did not register');
        return mod.api;
      })
      .catch(err => {
        mod.loading = null;
        throw err;
      });
  }
  return mod.loading;
}

/**
 * A route whose page lives in a module: the first visit shows a loading state, loads the module
 * (which replaces ROUTES[route] with the real page) and renders again.
 * @param {string} route   route name, for example 'import'
 * @param {string} module  module name
 * @param {string} title   page title while loading
 */
function lazyRoute(route, module, title) {
  return () => ({
    title,
    crumbs: [[title]],
    body: card('', '<div class="empty"><div class="empty-ico">' + icon('refresh', 22) + '</div><h4>Loading ' + esc(title) + '…</h4></div>'),
    mount(page) {
      loadFeatureModule(module)
        .then(() => {
          if (currentRoute && currentRoute.name === route) renderRoute();
        })
        .catch(err => {
          console.error(err);
          $('.page-body', page).innerHTML = card(
            '',
            '<div class="empty"><div class="empty-ico">' + icon('xCircle', 22) + '</div><h4>' + esc(title) +
              ' could not load</h4><p>' + esc(err.message) + '. Keep the src/modules/' + esc(module) +
              ' folder next to this page.</p></div>'
          );
        });
    }
  });
}
