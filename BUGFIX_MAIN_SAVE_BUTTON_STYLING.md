# Bug Fix: Row Styling Not Updating When Using Main Form Save Button

**Date**: 2025-11-20  
**Issue**: Row styling updates correctly when clicking Tablez Save button, but NOT when clicking main form Save button  
**Status**: ✅ FIXED

---

## 🐛 The Problem

### Symptoms
- Add a new row to a child table
- Row shows "unsaved" styling (yellow background, orange border)
- Click **Tablez Save button** (under the table) → Row styling updates correctly ✅
- Click **Main Form Save button** (top of form) → Row styling DOES NOT update ❌
- Row still looks unsaved even though it's saved to database

### Root Cause

**Tablez Save Button** (lines 593-643):
- Has explicit code to reload document and refresh grid
- Calls `frm.reload_doc()` then `frm.refresh_field()`
- This triggers `setup_enhanced_row_features()` which updates row styling

**Main Form Save Button**:
- Frappe saves form and clears `__islocal` and `__unsaved` flags
- BUT there was NO `after_save` hook in Tablez code
- Grid never refreshes, so row styling never updates
- Old `tablez-unsaved-row` CSS class remains on the row

---

## ✅ The Solution

Added an `after_save` hook in `configure_enhanced_grid()` that:
1. Detects when the form is saved
2. Waits 100ms for Frappe to clear flags
3. Refreshes all Tablez-enhanced grids
4. Re-runs `setup_enhanced_row_features(true)` on all rows
5. Updates the Save button visibility

---

## 📝 Code Changes

### File: `tablez/public/js/tablez_grid.js`

**Location**: Lines 911-958 (added to `configure_enhanced_grid` method)

**What was added**:
```javascript
// Setup after_save hook to refresh grid styling when form is saved
if (this.frm && !this.frm._tablez_save_hook_installed) {
    console.log('[Tablez] Installing after_save hook for form:', this.frm.doctype);
    this.frm._tablez_save_hook_installed = true;

    // Store original after_save if it exists
    const original_after_save = this.frm.after_save;

    // Override after_save
    this.frm.after_save = function() {
        console.log('[Tablez] Form saved, refreshing enhanced grids...');

        // Call original after_save first
        if (original_after_save) {
            original_after_save.call(this);
        }

        // Wait for Frappe to clear __islocal and __unsaved flags
        setTimeout(function() {
            // Refresh all enhanced grids in this form
            Object.keys(this.fields_dict).forEach(function(fieldname) {
                const field = this.fields_dict[fieldname];
                if (field.df.fieldtype === 'Table' && field.grid) {
                    const grid = field.grid;
                    
                    // Only refresh if this is a Tablez-enhanced grid
                    if (grid.wrapper && grid.wrapper.hasClass('tablez-enhanced-grid')) {
                        console.log('[Tablez] Refreshing grid:', fieldname);
                        
                        // Refresh all rows to update styling
                        if (grid.grid_rows) {
                            grid.grid_rows.forEach(function(row) {
                                if (row.setup_enhanced_row_features && row.doc) {
                                    row.setup_enhanced_row_features(true);
                                }
                            });
                        }
                        
                        // Refresh the add/save button
                        if (grid.setup_add_button) {
                            grid.setup_add_button();
                        }
                    }
                }
            }.bind(this));
        }.bind(this), 100);
    };
}
```

---

## 🔍 How It Works

1. **Hook Installation**: When `configure_enhanced_grid()` is called, it installs an `after_save` hook on the form
2. **One-time Setup**: Uses `_tablez_save_hook_installed` flag to prevent duplicate hooks
3. **Preserves Original**: Stores and calls original `after_save` if it exists
4. **Waits for Frappe**: 100ms delay allows Frappe to clear `__islocal` and `__unsaved` flags
5. **Refreshes All Grids**: Loops through all table fields and refreshes Tablez-enhanced ones
6. **Updates Styling**: Calls `setup_enhanced_row_features(true)` to re-evaluate row state
7. **Updates Buttons**: Calls `setup_add_button()` to show/hide Save button

---

## 🧪 Testing

### Test Steps
1. Open a form with a Tablez-enhanced child table
2. Add a new row
3. Verify row has "unsaved" styling (yellow background)
4. Click **main form Save button** (Ctrl+S or top button)
5. Wait for save to complete

### Expected Results
✅ Row styling updates to "saved" (normal background)  
✅ Save button disappears (if no other unsaved changes)  
✅ Console shows: `[Tablez] Form saved, refreshing enhanced grids...`  
✅ Console shows: `[Tablez] Refreshing grid: <fieldname>`

---

## 🚀 Deployment

```bash
# Build the app
bench build --app tablez --force

# Clear cache
bench clear-cache

# Restart (if needed)
bench restart
```

Then hard refresh browser: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

---

## 📊 Impact

- **Fixes**: Row styling now updates correctly regardless of which Save button is used
- **Backward Compatible**: Preserves existing `after_save` hooks
- **Performance**: Minimal impact (100ms delay, only runs on save)
- **Scope**: Only affects Tablez-enhanced grids

---

**Status**: ✅ Ready for Testing

