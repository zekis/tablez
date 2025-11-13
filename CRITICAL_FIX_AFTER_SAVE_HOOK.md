# Critical Fix: after_save Hook Not Being Set Up

**Date**: 2025-11-11  
**Issue**: after_save hook was never firing, so grid never refreshed after save  
**Status**: ✅ FIXED

---

## What the Logs Revealed

Looking at your console output, I found the smoking gun:

### ❌ What Was Missing

**Expected to see:**
```
[Tablez] Setting up after_save hook for form: Trigger Agent Stepwise Planner
[Tablez] after_save hook setup complete
```

**Expected when you save:**
```
[Tablez] after_save hook fired for form: Trigger Agent Stepwise Planner
[Tablez] Refreshing all grids after save...
```

**What we actually saw:**
- ❌ No "Setting up after_save hook" message
- ❌ No "after_save hook fired" message when you saved

### ✅ What Was Happening

**After you saved, we saw:**
```
[Tablez] Checking for unsaved changes: {
    hasUnsavedRowChanges: true,    ← Still true!
    formIsDirty: false,
    hasUnsavedChanges: true,       ← Still true!
    gridRowsCount: 5
}
[Tablez] Creating Save button
```

The grid WAS refreshing (multiple times actually), but it was refreshing IMMEDIATELY after save, before Frappe had time to clear the `__islocal` and `__unsaved` flags on the row.

So the Save button kept getting recreated because the row still looked "unsaved".

---

## The Root Cause

The after_save hook was set up in the `make()` method, which is called when a NEW grid is created.

**But your grid was created BEFORE our Tablez code initialized!**

Here's what happened:

1. Form loads
2. Grid is created (make() is called)
3. Grid is configured with configure_enhanced_grid()
4. **THEN** Tablez code initializes and adds methods to Grid.prototype
5. Grid already exists, so make() is never called again
6. after_save hook is never set up

---

## The Fix

I've added the after_save hook setup to **THREE places** to cover all scenarios:

### 1. In make() Method
For new grids created after Tablez initializes.

### 2. In configure_enhanced_grid() Method
For grids that are explicitly configured by the user.

### 3. In enhanceExistingGrids() Function ⭐ KEY FIX
For grids that were already created and configured before Tablez initialized.

This is the critical one for your case!

---

## What Changed

### File: tablez/public/js/tablez_grid.js

**Added to configure_enhanced_grid() (lines 930-971):**
```javascript
// Setup after_save hook to refresh grid after form save
if (this.frm && !this.frm._tablez_save_listener) {
    console.log('[Tablez] Setting up after_save hook in configure_enhanced_grid for form:', this.frm.doctype);
    this.frm._tablez_save_listener = true;
    const me = this;

    const original_after_save = this.frm.after_save;
    this.frm.after_save = function() {
        console.log('[Tablez] after_save hook fired for form:', this.doctype);
        
        if (original_after_save) {
            original_after_save.call(this);
        }

        // Wait 100ms for Frappe to clear __islocal and __unsaved flags
        setTimeout(function() {
            console.log('[Tablez] Refreshing all grids after save...');
            
            // Refresh all grids
            Object.keys(me.frm.fields_dict).forEach(function(fieldname) {
                const field = me.frm.fields_dict[fieldname];
                if (field.df.fieldtype === 'Table' && field.grid) {
                    if (field.grid.refresh) {
                        field.grid.refresh();
                    }
                    if (field.grid.setup_add_button) {
                        field.grid.setup_add_button();
                    }
                }
            });
        }, 100);
    };
}
```

**Added to enhanceExistingGrids() (lines 995-1038):**
```javascript
// Setup after_save hook for the form (if not already set up)
if (!cur_frm._tablez_save_listener) {
    console.log('[Tablez] Setting up after_save hook in enhanceExistingGrids for form:', cur_frm.doctype);
    cur_frm._tablez_save_listener = true;

    const original_after_save = cur_frm.after_save;
    cur_frm.after_save = function() {
        console.log('[Tablez] after_save hook fired for form:', this.doctype);
        
        if (original_after_save) {
            original_after_save.call(this);
        }

        setTimeout(function() {
            console.log('[Tablez] Refreshing all grids after save...');
            
            // Refresh all grids
            Object.keys(cur_frm.fields_dict).forEach(function(fieldname) {
                const field = cur_frm.fields_dict[fieldname];
                if (field.df.fieldtype === 'Table' && field.grid) {
                    if (field.grid.refresh) {
                        field.grid.refresh();
                    }
                    if (field.grid.setup_add_button) {
                        field.grid.setup_add_button();
                    }
                }
            });
        }, 100);
    };
}
```

---

## Expected Behavior After Fix

### When Form Loads

You should now see:
```
[Tablez] Initializing enhanced grid...
[Tablez] Adding methods to Grid class...
[Tablez] Grid class initialized successfully
[Tablez] Enhancing existing grids on form: Trigger Agent Stepwise Planner
[Tablez] Setting up after_save hook in enhanceExistingGrids for form: Trigger Agent Stepwise Planner
[Tablez] after_save hook setup complete in enhanceExistingGrids
[Tablez] Re-enhancing grid for field: available_tools
```

### When You Add a Row

```
[Tablez] Checking for unsaved changes: {
    hasUnsavedRowChanges: true,
    formIsDirty: true,
    hasUnsavedChanges: true,
    gridRowsCount: 5
}
[Tablez] Creating Save button
```

### When You Click Save ⭐ THE KEY MOMENT

```
[Tablez] Save button clicked, saving form
[Tablez] after_save hook fired for form: Trigger Agent Stepwise Planner
[Tablez] Calling original after_save
[Tablez] Refreshing all grids after save (from enhanceExistingGrids hook)...
[Tablez] Refreshing grid: available_tools
[Tablez] Refreshing grid: available_agents
[Tablez] Refreshed 2 grids
```

### After the 100ms Delay

```
[Tablez] refresh() called for grid: available_tools
[Tablez] Grid has tablez-enhanced-grid class, applying enhanced refresh
[Tablez] apply_enhanced_refresh() called
[Tablez] Setting up enhanced row features for 5 rows
[Tablez] Setting up add button
[Tablez] setup_add_button() called, show_add_button: true
[Tablez] Checking for unsaved changes: {
    hasUnsavedRowChanges: false,    ← NOW FALSE!
    formIsDirty: false,
    hasUnsavedChanges: false,       ← NOW FALSE!
    gridRowsCount: 5
}
[Tablez] No unsaved changes, not creating Save button  ← SAVE BUTTON REMOVED!
```

---

## Next Steps

### 1. Rebuild the App ⚠️

```bash
bench build --app tablez --force
```

### 2. Clear Browser Cache

Press `Ctrl+Shift+R`

### 3. Test the Scenario

1. Open "Trigger Agent Stepwise Planner"
2. Add a row
3. Click Save
4. **Watch the console for the after_save hook logs**

### 4. Verify Success

After save, you should see:
- ✅ "[Tablez] after_save hook fired for form: Trigger Agent Stepwise Planner"
- ✅ "[Tablez] Refreshing all grids after save..."
- ✅ "hasUnsavedRowChanges: false" (after the 100ms delay)
- ✅ "No unsaved changes, not creating Save button"
- ✅ Save button disappears from the UI

---

## Why This Should Work Now

1. **Hook is set up early**: In enhanceExistingGrids(), which runs right after Grid class is initialized
2. **Hook fires after save**: Frappe calls frm.after_save() when save completes
3. **100ms delay**: Gives Frappe time to clear __islocal and __unsaved flags
4. **Grid refreshes**: With the flags cleared, hasUnsavedRowChanges will be false
5. **Save button removed**: setup_add_button() sees no unsaved changes and doesn't create the button

---

## If It Still Doesn't Work

If you still see the Save button after save, check the console for:

1. **Is the hook being set up?**
   - Look for: "[Tablez] Setting up after_save hook in enhanceExistingGrids"

2. **Is the hook firing?**
   - Look for: "[Tablez] after_save hook fired for form:"

3. **Are the flags still set after the delay?**
   - Look for: "hasUnsavedRowChanges: true" after the hook fires
   - If still true, we may need to increase the delay from 100ms to 200ms or 300ms

Share the console output and we'll debug further!

---

**This should finally fix the issue!** 🎉

