/* =========================================================================
   INVENTORY MODULE
   Start of the module: remembers which routes exist before it adds its
   own.

   Provides: ROUTES_BEFORE
   ========================================================================= */
'use strict';

const ROUTES_BEFORE = new Set(Object.keys(ROUTES));
