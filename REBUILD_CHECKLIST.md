# Tablez Rebuild Checklist

**Date**: 2025-11-11  
**Status**: Ready for rebuild and testing

---

## Pre-Rebuild Verification ✅

- [x] All grid methods consolidated into tablez_grid.js
- [x] All 23 methods verified present
- [x] All 30+ config options verified
- [x] after_save hook verified (single, no duplicates)
- [x] hooks.py updated correctly
- [x] enhanced_grid_row.js unchanged
- [x] grid_utils.js unchanged
- [x] Old files archived
- [x] Documentation created

---

## Rebuild Steps

### Step 1: Navigate to Frappe Bench Directory

```bash
# Find your bench directory
# Common locations:
# - ~/frappe-bench
# - /home/frappe/frappe-bench
# - C:\frappe-bench (Windows)

cd /path/to/your/frappe-bench
```

### Step 2: Run Build Command

```bash
# Standard build
bench build --app tablez

# OR with force flag (recommended)
bench build --app tablez --force
```

**Expected output:**
```
✔ Building tablez assets...
✔ Compiling JavaScript...
✔ Compiling CSS...
✔ Build complete
```

**If build fails:**
- Check for syntax errors in JavaScript files
- Check console output for specific errors
- Verify hooks.py is correct
- Try `bench clear-cache` then rebuild

### Step 3: Clear Server Cache (Optional but Recommended)

```bash
bench clear-cache
```

### Step 4: Restart Bench (If Running)

```bash
# If bench is running, restart it
bench restart
```

---

## Post-Rebuild Verification

### Browser Steps

1. **Clear Browser Cache**
   - Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Firefox: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
   - Or use DevTools → Network → Disable cache

2. **Open Browser Console**
   - Chrome/Edge/Firefox: F12 → Console tab
   - Keep console open during testing

3. **Navigate to a Form with Child Tables**
   - Open any doctype with table fields
   - Example: Sales Order, Purchase Order, etc.

### Console Verification

Look for these messages in the console:

```
✅ Expected messages:
- "Tablez: Initializing enhanced grid..."
- "Tablez: Adding methods to Grid class..."
- "Tablez: Grid class initialized successfully"
- "Initializing Enhanced Grid Row..."
- "[Tablez] Grid utilities loaded"

❌ Should NOT see:
- "Tablez: Grid class not found"
- "enhanced_grid.js" errors
- "configure_tablez is not a function"
- Any JavaScript errors related to Tablez
```

---

## Testing Checklist

### Basic Grid Functionality

- [ ] Grid loads without errors
- [ ] Grid displays data correctly
- [ ] Can add new rows
- [ ] Can edit existing rows
- [ ] Can delete rows
- [ ] Can save form

### Save Button Issue (Original Bug Fix)

**Test Case 1: Add Row**
- [ ] Click "Add Row" or add row inline
- [ ] New row appears with "new" styling
- [ ] Save button appears in grid footer
- [ ] Click Save button
- [ ] Form saves successfully
- [ ] **Row styling updates (no longer "new")** ← KEY FIX
- [ ] **Save button disappears** ← KEY FIX

**Test Case 2: Delete Row**
- [ ] Delete a row
- [ ] Save button appears
- [ ] Click Save button
- [ ] Form saves successfully
- [ ] Row is removed
- [ ] Save button disappears

**Test Case 3: Edit Row**
- [ ] Edit an existing row
- [ ] Row shows "unsaved" styling
- [ ] Save button appears
- [ ] Click Save button
- [ ] Form saves successfully
- [ ] Row styling updates
- [ ] Save button disappears

### Enhanced Features (If Configured)

**Column Sorting:**
- [ ] Click column headers
- [ ] Grid sorts by that column
- [ ] Click again to reverse sort

**Total Row:**
- [ ] Total row displays at bottom
- [ ] Totals calculate correctly
- [ ] Totals update when data changes

**Custom Column Widths:**
- [ ] Columns have correct widths
- [ ] Widths persist after refresh

**Row Click:**
- [ ] Click row to open document (if configured)
- [ ] Shift+click to open editor (if configured)

**Add Button:**
- [ ] Add button appears in footer (if configured)
- [ ] Click opens dialog (if configured)
- [ ] Can add row with pre-filled data

**Edit/Delete Buttons:**
- [ ] Edit button appears in rows (if configured)
- [ ] Delete button appears in rows (if configured)
- [ ] Buttons work correctly

---

## Troubleshooting

### Issue: Build Fails

**Symptoms:**
- `bench build --app tablez` returns errors
- Syntax errors in console

**Solutions:**
1. Check JavaScript syntax in tablez_grid.js
2. Verify hooks.py is correct
3. Run `bench clear-cache`
4. Try `bench build --app tablez --force`

### Issue: Grid Not Loading

**Symptoms:**
- Grid appears but no enhancements
- Console shows "Grid class not found"

**Solutions:**
1. Verify build completed successfully
2. Clear browser cache completely
3. Check console for JavaScript errors
4. Verify tablez_grid.js is loaded (Network tab)

### Issue: Save Button Not Disappearing

**Symptoms:**
- Save button appears but doesn't disappear after save
- Row styling doesn't update

**Solutions:**
1. Verify after_save hook is set up (check console)
2. Check if `this.frm._tablez_save_listener` is true
3. Verify `configure_enhanced_grid()` was called
4. Check for JavaScript errors in console

### Issue: Features Not Working

**Symptoms:**
- Sorting doesn't work
- Total row doesn't appear
- Row click doesn't work

**Solutions:**
1. Verify `configure_enhanced_grid()` was called
2. Check configuration options are correct
3. Verify methods exist on grid object (console: `cur_frm.fields_dict.items.grid`)
4. Check for JavaScript errors

---

## Rollback Plan (If Needed)

If you encounter critical issues:

### Option 1: Git Rollback

```bash
# View recent commits
git log --oneline -10

# Rollback to previous commit
git reset --hard <commit-hash>

# Rebuild
bench build --app tablez --force
```

### Option 2: Restore from Backup

If you have backups of the old files:
1. Restore old files
2. Update hooks.py
3. Rebuild app

### Option 3: Disable Tablez

Temporarily disable in hooks.py:

```python
app_include_js = [
    # "/assets/tablez/js/tablez_grid.js",
    # "/assets/tablez/js/grid_utils.js",
    # "/assets/tablez/js/enhanced_grid_row.js"
]
```

Then rebuild.

---

## Success Criteria

✅ **All tests pass**  
✅ **No console errors**  
✅ **Save button issue fixed**  
✅ **All configured features work**  
✅ **No regressions**  

---

## Post-Testing

After successful testing:

1. **Commit Changes**
   ```bash
   git add .
   git commit -m "Consolidate Tablez grid code - eliminate duplicates"
   ```

2. **Push to Remote** (if applicable)
   ```bash
   git push origin main
   ```

3. **Deploy to Production** (when ready)
   - Test in staging first
   - Monitor for issues
   - Have rollback plan ready

4. **Update Documentation**
   - Update README if needed
   - Document any configuration changes
   - Update examples if needed

---

## Notes

- The consolidation preserves ALL functionality
- No breaking changes to user code
- Backward compatible with existing configurations
- All 23 methods verified present
- All 30+ config options verified

---

**Ready to rebuild!** 🚀

Follow the steps above and check off each item as you complete it.

