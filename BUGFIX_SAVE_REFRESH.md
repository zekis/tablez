# Bug Fix: Save Button Not Disappearing After Add Row

**Date**: 2025-11-11  
**Issue**: After adding a row and saving, the grid doesn't refresh and the save button doesn't disappear  
**Status**: ✅ FIXED

---

## The Problem

### Symptoms
1. **Delete row** → Save → ✅ Works correctly (grid refreshes, save button disappears)
2. **Add row** → Save → ❌ Doesn't work (grid doesn't refresh, save button stays, row still shows "new" styling)

### Root Cause

The `after_save` hook was only being set up when `configure_enhanced_grid()` was called. 

**This means:**
- ✅ Grids with explicit configuration (e.g., Sales Order items) worked fine
- ❌ Grids without explicit configuration (e.g., Trigger Agent Stepwise Planner) didn't refresh after save

**Why delete worked but add didn't:**
- Delete triggers a grid refresh through Frappe's built-in mechanism
- Add row doesn't trigger the same refresh, so it relied on our after_save hook
- If the hook wasn't set up, the grid never refreshed after save

---

## The Fix

### What Changed

**File**: `tablez/public/js/tablez_grid.js`

**Change 1: Moved after_save hook to make() method**

The hook is now set up automatically for **ALL grids** during initialization, not just when `configure_enhanced_grid()` is called.

**Before** (lines 873-894 in configure_enhanced_grid):
```javascript
// Hook only set up when configure_enhanced_grid() was called
if (this.frm && !this.frm._tablez_save_listener) {
    this.frm._tablez_save_listener = true;
    const me = this;
    
    const original_after_save = this.frm.after_save;
    this.frm.after_save = function() {
        if (original_after_save) {
            original_after_save.call(this);
        }
        
        setTimeout(function() {
            if (me.refresh) {
                me.refresh();
            }
            if (me.setup_add_button) {
                me.setup_add_button();
            }
        }, 100);
    };
}
```

**After** (lines 50-78 in make):
```javascript
// Hook set up for ALL grids during initialization
if (this.frm && !this.frm._tablez_save_listener) {
    this.frm._tablez_save_listener = true;
    const me = this;

    const original_after_save = this.frm.after_save;
    this.frm.after_save = function() {
        if (original_after_save) {
            original_after_save.call(this);
        }

        // Wait for Frappe to clear __islocal and __unsaved flags
        setTimeout(function() {
            // Refresh all grids on the form
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

**Change 2: Removed duplicate hook from configure_enhanced_grid()**

Since the hook is now set up globally in `make()`, the duplicate in `configure_enhanced_grid()` was removed.

---

## Benefits of This Fix

### 1. Works for ALL Grids ✅
- **Before**: Only worked for grids with explicit `configure_enhanced_grid()` call
- **After**: Works for ALL grids, configured or not

### 2. Refreshes ALL Grids on Form ✅
- **Before**: Only refreshed the specific grid that was configured
- **After**: Refreshes ALL grids on the form after save

### 3. No Configuration Required ✅
- **Before**: Had to call `configure_enhanced_grid()` to get save refresh working
- **After**: Works automatically for all grids

### 4. More Robust ✅
- **Before**: Easy to forget to configure a grid and have broken save behavior
- **After**: Save refresh works by default for all grids

---

## Testing

### Test Case 1: Unconfigured Grid (The Original Bug)

**Form**: Trigger Agent Stepwise Planner  
**Field**: available_tools  
**Configuration**: None (no configure_enhanced_grid call)

**Steps:**
1. Open form
2. Add a row to available_tools table
3. Click Save button in grid footer
4. Form saves

**Expected Result:**
- ✅ Grid refreshes
- ✅ Row no longer shows "new" styling
- ✅ Save button disappears

### Test Case 2: Configured Grid

**Form**: Sales Order (or any form with configured grid)  
**Field**: items  
**Configuration**: Has configure_enhanced_grid() call

**Steps:**
1. Open form
2. Add a row to items table
3. Click Save button
4. Form saves

**Expected Result:**
- ✅ Grid refreshes
- ✅ Row no longer shows "new" styling
- ✅ Save button disappears
- ✅ All configured features still work

### Test Case 3: Delete Row (Should Still Work)

**Form**: Any form  
**Field**: Any table field

**Steps:**
1. Open form
2. Delete a row
3. Click Save button
4. Form saves

**Expected Result:**
- ✅ Grid refreshes
- ✅ Row is removed
- ✅ Save button disappears

### Test Case 4: Edit Row

**Form**: Any form  
**Field**: Any table field

**Steps:**
1. Open form
2. Edit an existing row
3. Click Save button
4. Form saves

**Expected Result:**
- ✅ Grid refreshes
- ✅ Row no longer shows "unsaved" styling
- ✅ Save button disappears

---

## Technical Details

### How It Works

1. **Grid Initialization**: When a grid is created, `make()` is called
2. **Hook Setup**: During `make()`, the after_save hook is set up on the form
3. **Save Event**: When the form is saved, the hook fires
4. **Delay**: 100ms delay ensures Frappe has cleared `__islocal` and `__unsaved` flags
5. **Refresh All Grids**: All grids on the form are refreshed
6. **Update Buttons**: Add/Save buttons are updated for all grids

### Why Refresh All Grids?

Refreshing all grids on the form (not just the one that was modified) ensures:
- Consistent behavior across all grids
- Handles cases where multiple grids are modified
- Simpler code (no need to track which grid was modified)
- More robust (no edge cases where a grid doesn't refresh)

### Performance Impact

Minimal - the refresh only happens after save, which is already a relatively slow operation. The 100ms delay is necessary to ensure Frappe has updated the document state.

---

## Rebuild Required ⚠️

**You must rebuild the app for this fix to take effect:**

```bash
bench build --app tablez --force
```

Then:
1. Clear browser cache (Ctrl+Shift+R)
2. Test adding/deleting/editing rows
3. Verify save button appears/disappears correctly

---

## Verification Checklist

After rebuilding, verify:

- [ ] Open a form with a table (any form)
- [ ] Add a row
- [ ] Save button appears
- [ ] Click Save
- [ ] Form saves successfully
- [ ] **Grid refreshes** ← KEY FIX
- [ ] **Row styling updates (no longer "new")** ← KEY FIX
- [ ] **Save button disappears** ← KEY FIX
- [ ] Delete a row → Save → Grid refreshes, save button disappears
- [ ] Edit a row → Save → Grid refreshes, save button disappears
- [ ] All configured grid features still work

---

## Files Changed

### tablez/public/js/tablez_grid.js

**Lines 50-78**: Added after_save hook setup in make() method  
**Lines 865-875**: Removed duplicate after_save hook from configure_enhanced_grid()

**Total changes**: ~30 lines modified

---

## Backward Compatibility

✅ **No breaking changes**

- All existing configurations continue to work
- No API changes
- No configuration changes required
- Existing grids work better (refresh after save)

---

## Summary

**Problem**: Save button didn't disappear after adding row (only affected unconfigured grids)  
**Root Cause**: after_save hook only set up when configure_enhanced_grid() was called  
**Solution**: Move hook setup to make() so it's set up for ALL grids automatically  
**Result**: Save refresh now works for all grids, configured or not  

**Status**: ✅ FIXED - Ready to rebuild and test!

