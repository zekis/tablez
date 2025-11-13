# Debug Logs Added to Tablez Grid

**Date**: 2025-11-11  
**Purpose**: Help diagnose why save button doesn't disappear after adding row

---

## Console Logs Added

I've added comprehensive console logs throughout the grid code to help us understand what's happening (or not happening) when you save the form.

### 1. after_save Hook Setup (in make() method)

**When the grid is initialized, you'll see:**

```
[Tablez] Setting up after_save hook for form: <DocType Name>
[Tablez] after_save hook setup complete
```

**Or if already set up:**
```
[Tablez] after_save hook already set up for form: <DocType Name>
```

**Or if no form available:**
```
[Tablez] No form available, skipping after_save hook setup
```

### 2. after_save Hook Execution

**When you save the form, you should see:**

```
[Tablez] after_save hook fired for form: <DocType Name>
[Tablez] Calling original after_save
[Tablez] Refreshing all grids after save...
[Tablez] Refreshing grid: <field_name>
[Tablez] Refreshing grid: <field_name>
...
[Tablez] Refreshed <N> grids
```

### 3. Grid Refresh

**When a grid is refreshed, you'll see:**

```
[Tablez] refresh() called for grid: <field_name>
[Tablez] Grid has tablez-enhanced-grid class, applying enhanced refresh
```

**Or if not enhanced:**
```
[Tablez] refresh() called for grid: <field_name>
[Tablez] Grid does NOT have tablez-enhanced-grid class, skipping enhanced refresh
```

### 4. Enhanced Refresh

**When enhanced refresh is applied, you'll see:**

```
[Tablez] apply_enhanced_refresh() called
[Tablez] Applying enhanced refresh with config: <config object>
[Tablez] Setting up enhanced row features for <N> rows
[Tablez] Setting up add button
[Tablez] apply_enhanced_refresh() complete
```

**Or if not configured:**
```
[Tablez] apply_enhanced_refresh() called
[Tablez] No enhanced_config or not enabled, skipping
```

### 5. Add/Save Button Setup

**When setup_add_button() is called, you'll see:**

```
[Tablez] setup_add_button() called, show_add_button: true/false
```

**If show_add_button is true:**
```
[Tablez] Removing old tablez buttons
[Tablez] Add button created
[Tablez] Checking for unsaved changes: {
    hasUnsavedRowChanges: true/false,
    formIsDirty: true/false,
    hasUnsavedChanges: true/false,
    gridRowsCount: <N>
}
```

**If there are unsaved changes:**
```
[Tablez] Creating Save button
[Tablez] Save button created and added
```

**If no unsaved changes:**
```
[Tablez] No unsaved changes, not creating Save button
```

---

## How to Use These Logs

### Step 1: Rebuild the App

```bash
bench build --app tablez --force
```

### Step 2: Clear Browser Cache

Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

### Step 3: Open Browser Console

Press `F12` → Console tab

### Step 4: Test the Scenario

1. **Open a form with a table** (e.g., Trigger Agent Stepwise Planner)
2. **Watch the console** - You should see initialization logs
3. **Add a row** - Watch for any logs
4. **Click Save** - Watch for after_save hook logs
5. **After save completes** - Watch for refresh logs

### Step 5: Share the Console Output

Copy all the `[Tablez]` logs from the console and share them with me. This will help us understand:

- ✅ Is the after_save hook being set up?
- ✅ Is the after_save hook firing when you save?
- ✅ Are the grids being refreshed?
- ✅ Does the grid have the tablez-enhanced-grid class?
- ✅ Is the enhanced refresh being applied?
- ✅ Is setup_add_button() being called?
- ✅ Are unsaved changes being detected correctly?
- ✅ Is the Save button being removed after save?

---

## Expected Log Sequence

### When Form Loads

```
[Tablez] Initializing enhanced grid...
[Tablez] Adding methods to Grid class...
[Tablez] Grid class initialized successfully
[Tablez] Setting up after_save hook for form: Trigger Agent Stepwise Planner
[Tablez] after_save hook setup complete
[Tablez] Re-enhancing grid for field: available_tools
```

### When You Add a Row

```
(No specific Tablez logs expected here - Frappe handles row addition)
```

### When You Click Save

```
[Tablez] after_save hook fired for form: Trigger Agent Stepwise Planner
[Tablez] Calling original after_save
[Tablez] Refreshing all grids after save...
[Tablez] Refreshing grid: available_tools
[Tablez] refresh() called for grid: available_tools
[Tablez] Grid does NOT have tablez-enhanced-grid class, skipping enhanced refresh
[Tablez] Refreshed 1 grids
```

**⚠️ IMPORTANT**: Notice the "Grid does NOT have tablez-enhanced-grid class" message. This might be the issue!

---

## Possible Issues to Look For

### Issue 1: after_save Hook Not Set Up

**Symptom**: No logs about "Setting up after_save hook"

**Cause**: Grid initialization failed or form not available

**Solution**: Check if grid is being initialized correctly

### Issue 2: after_save Hook Not Firing

**Symptom**: No logs about "after_save hook fired" when you save

**Cause**: Hook wasn't set up, or Frappe's save mechanism bypassed it

**Solution**: Check if hook was set up correctly

### Issue 3: Grid Not Being Refreshed

**Symptom**: after_save fires but no "Refreshing grid" logs

**Cause**: Grid not found in form fields, or refresh method missing

**Solution**: Check if grid exists and has refresh method

### Issue 4: Grid Not Enhanced

**Symptom**: "Grid does NOT have tablez-enhanced-grid class"

**Cause**: Grid was never configured with configure_enhanced_grid()

**Solution**: This is expected for unconfigured grids, but the refresh should still work

### Issue 5: setup_add_button() Not Called

**Symptom**: No logs about "setup_add_button() called"

**Cause**: show_add_button is false, or method not being called

**Solution**: Check if show_add_button is true in config

### Issue 6: Unsaved Changes Not Detected After Save

**Symptom**: After save, logs show "hasUnsavedChanges: true"

**Cause**: Frappe hasn't cleared __islocal and __unsaved flags yet

**Solution**: May need to increase the 100ms delay

---

## What I'm Looking For

When you share the console logs, I'll be looking for:

1. **Is the hook set up?** → Should see "Setting up after_save hook"
2. **Does the hook fire?** → Should see "after_save hook fired"
3. **Are grids refreshed?** → Should see "Refreshing grid: <name>"
4. **Is enhanced refresh applied?** → Should see "apply_enhanced_refresh() called"
5. **Is setup_add_button() called?** → Should see "setup_add_button() called"
6. **Are unsaved changes detected correctly?** → Should see the unsaved changes object
7. **Is the Save button removed?** → Should see "No unsaved changes, not creating Save button" after save

---

## Next Steps

1. **Rebuild the app** with the new debug logs
2. **Test the scenario** (add row → save)
3. **Copy all `[Tablez]` logs** from the console
4. **Share the logs** with me

This will help us pinpoint exactly where the issue is!

---

## Files Modified

- `tablez/public/js/tablez_grid.js` - Added ~20 console.log statements throughout the code

---

**Ready to debug!** 🔍

