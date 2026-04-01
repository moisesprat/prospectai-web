/* ============================================================
   SHARED STATE
   Single source of truth for mutable app state.
   ============================================================ */

let _selectedSector = null;
let _isRunning = false;

export function getSelectedSector()    { return _selectedSector; }
export function setSelectedSector(s)   { _selectedSector = s; }
export function getIsRunning()         { return _isRunning; }
export function setIsRunning(v)        { _isRunning = v; }
