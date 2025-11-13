# Fix: Using Frappe's Event System Correctly

**Date**: 2025-11-11  
**Issue**: `this.frm.on is not a function` error  
**Status**: ✅ FIXED

---

## The Error

```
Uncaught TypeError: this.frm.on is not a function
    at GridClass.configure_enhanced_grid (tablez_grid.js:944:26)
```

## The Problem

I tried to use `this.frm.on('after_save', ...)` but Frappe's form object doesn't have an `.on()` method.

## The Solution

Use Frappe's script manager event system instead:

```javascript
frappe.ui.form.on(doctype, {
    after_save: function(frm) {
        // Your code here
    }
});
```

---

## What Changed

### File: tablez/public/js/tablez_grid.js

**In configure_enhanced_grid() (lines 936-988):**

**Before (WRONG):**
```javascript
this.frm.on('after_save', function() {
    // This doesn't work!
});
```

**After (CORRECT):**
```javascript
const doctype = this.frm.doctype;

frappe.ui.form.on(doctype, {
    after_save: function(frm) {
        console.log('[Tablez] after_save event fired for form:', frm.doctype);
        
        setTimeout(function() {
            // Refresh all grids
            Object.keys(frm.fields_dict).forEach(function(fieldname) {
                const field = frm.fields_dict[fieldname];
                if (field.df.fieldtype === 'Table' && field.grid) {
                    if (field.grid.refresh) {
                        field.grid.refresh();
                    }
                    if (field.grid.setup_add_button) {
                        field.grid.setup_add_button();
                    }
                }
            });
        }, 200); // Increased delay to 200ms
    }
});
```

**In enhanceExistingGrids() (lines 1012-1051):**

Same change - using `frappe.ui.form.on()` instead of overriding `frm.after_save`.

---

## Key Changes

1. **Correct event system**: Using `frappe.ui.form.on(doctype, { after_save: ... })`
2. **Increased delay**: Changed from 100ms to 200ms to give Frappe more time to clear flags
3. **Better logging**: Added row state logging to see exactly what's happening

---

## Expected Behavior

### When Form Loads

```
[Tablez] Enhancing existing grids on form: Trigger Agent
[Tablez] Setting up after_save hook in enhanceExistingGrids for form: Trigger Agent
[Tablez] after_save hook setup complete in enhanceExistingGrids
```

### When You Add a Row

```
[Tablez] Row states: [
    {idx: 1, name: "abc123", __islocal: undefined, __unsaved: undefined},
    {idx: 2, name: "abc456", __islocal: undefined, __unsaved: undefined},
    {idx: 3, name: "new-row-1", __islocal: 1, __unsaved: 1}  ← New row
]
[Tablez] Checking for unsaved changes: {
    hasUnsavedRowChanges: true,
    formIsDirty: true,
    hasUnsavedChanges: true
}
[Tablez] Creating Save button
```

### When You Click Save ⭐ KEY MOMENT

```
[Tablez] Save button clicked, saving form
[Tablez] after_save event fired for form: Trigger Agent  ← SHOULD SEE THIS NOW!
[Tablez] Refreshing all grids after save (from enhanceExistingGrids hook)...
[Tablez] Refreshing grid: available_tools
[Tablez] Refreshing grid: available_agents
[Tablez] Refreshed 2 grids
```

### After 200ms Delay

```
[Tablez] refresh() called for grid: available_tools
[Tablez] Row states: [
    {idx: 1, name: "abc123", __islocal: undefined, __unsaved: undefined},
    {idx: 2, name: "abc456", __islocal: undefined, __unsaved: undefined},
    {idx: 3, name: "abc789", __islocal: undefined, __unsaved: undefined}  ← Flags cleared!
]
[Tablez] Checking for unsaved changes: {
    hasUnsavedRowChanges: false,  ← NOW FALSE!
    formIsDirty: false,
    hasUnsavedChanges: false
}
[Tablez] No unsaved changes, not creating Save button  ← SAVE BUTTON REMOVED!
```

---

## Why This Should Work

1. **Correct API**: Using Frappe's documented event system
2. **Longer delay**: 200ms gives Frappe more time to update document state
3. **Proper event firing**: `frappe.ui.form.on()` is the standard way to hook into form events

---

## Next Steps

**Rebuild:**

```bash
bench build --app tablez --force
```

Then:
1. Clear browser cache (`Ctrl+Shift+R`)
2. Open the form
3. Add a row
4. Click Save
5. **Look for `[Tablez] after_save event fired`**

---

## What to Look For

### Success Indicators ✅

- ✅ No more `TypeError: this.frm.on is not a function`
- ✅ See `[Tablez] after_save event fired for form: Trigger Agent`
- ✅ See row states with `__islocal: undefined` after save
- ✅ See `hasUnsavedRowChanges: false` after save
- ✅ Save button disappears

### If It Still Doesn't Work

Check the row states in the console:
- **Before save**: Should see `__islocal: 1` on new row
- **After save**: Should see `__islocal: undefined` on all rows

If `__islocal` is still set after save, we may need to:
- Increase the delay from 200ms to 300ms or 500ms
- Use a different approach to detect when Frappe has finished updating

---

**This should finally work!** 🎉

