# Tablez - Installation Checklist

## Pre-Installation

- [ ] Frappe Framework v14 or v15 installed
- [ ] Bench setup complete
- [ ] Site created and accessible
- [ ] Backup current site (recommended)

## Installation Steps

### 1. Get the App

```bash
cd ~/frappe-bench
bench get-app /path/to/tablez
```

**Expected Output**:
```
Getting tablez
$ git clone /path/to/tablez ./apps/tablez
Cloning into './apps/tablez'...
done.
Installing tablez
$ ./env/bin/pip install -q -U -e ./apps/tablez
```

- [ ] App cloned successfully
- [ ] No error messages

### 2. Install on Site

```bash
bench --site your-site install-app tablez
```

**Expected Output**:
```
Installing tablez...
Updating DocTypes for tablez: [========================================]
tablez installed
```

- [ ] App installed successfully
- [ ] No error messages

### 3. Build Assets

```bash
bench build --app tablez
```

**Expected Output**:
```
Building tablez assets...
✔ Built js/tablez.min.js
✔ Built css/tablez.min.css
```

- [ ] Assets built successfully
- [ ] Files created in `sites/assets/tablez/`

### 4. Clear Cache

```bash
bench clear-cache
bench clear-website-cache
```

**Expected Output**:
```
Cleared cache for all sites
```

- [ ] Cache cleared

### 5. Restart Bench

```bash
bench restart
```

**Expected Output**:
```
Restarting bench...
```

- [ ] Bench restarted

## Verification

### 1. Check Files

Verify these files exist:

```bash
ls -la ~/frappe-bench/sites/assets/tablez/
```

**Expected Files**:
- [ ] `js/enhanced_grid.js`
- [ ] `js/enhanced_grid_row.js`
- [ ] `js/grid_utils.js`
- [ ] `css/enhanced_grid.css`

### 2. Check Browser Console

1. Open Frappe in browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for these messages:

**Expected Console Output**:
```
Grid utilities loaded
Enhanced Grid loaded successfully
Enhanced Grid Row loaded successfully
```

- [ ] All three messages appear
- [ ] No JavaScript errors

### 3. Test Basic Functionality

#### Test 1: Open a Form with Child Table

1. Go to Sales Order (or any doctype with child table)
2. Open an existing record or create new
3. Look at the items table

**Expected**:
- [ ] Table renders normally
- [ ] No visual glitches
- [ ] No console errors

#### Test 2: Click a Row

1. Click anywhere on a row in the items table

**Expected**:
- [ ] Opens the linked document (e.g., Item)
- [ ] Does NOT open row editor
- [ ] Cursor shows pointer on hover

#### Test 3: Shift+Click a Row

1. Hold Shift and click a row

**Expected**:
- [ ] Opens row editor (old behavior)
- [ ] Form appears below the row

#### Test 4: Click Column Header

1. Click on "Qty" column header (or any column)

**Expected**:
- [ ] Table sorts by that column
- [ ] Sort indicator (▲ or ▼) appears
- [ ] Click again reverses sort

#### Test 5: Hover Over Row

1. Hover mouse over a row

**Expected**:
- [ ] Row background changes (hover effect)
- [ ] Action buttons appear on right (📋 ⬆ ⬇)
- [ ] Cursor shows pointer

#### Test 6: Click Link Field

1. Find a link field in the table (e.g., Item Code)
2. Click anywhere in that cell

**Expected**:
- [ ] Opens the linked document
- [ ] Entire cell is clickable (not just arrow)
- [ ] 🔗 icon visible

## Troubleshooting

### Issue: Assets not loading

**Symptoms**: No console messages, grid looks the same

**Solution**:
```bash
# Rebuild assets
bench build --app tablez

# Clear cache thoroughly
bench clear-cache
bench clear-website-cache

# Restart
bench restart

# Hard refresh browser
# Chrome/Firefox: Ctrl+Shift+R
# Mac: Cmd+Shift+R
```

- [ ] Tried rebuild
- [ ] Tried cache clear
- [ ] Tried hard refresh

### Issue: JavaScript errors in console

**Symptoms**: Errors in browser console

**Solution**:
1. Check error message
2. Verify Frappe version compatibility
3. Check for conflicts with other apps

**Common Errors**:

| Error | Cause | Solution |
|-------|-------|----------|
| `frappe.ui.form.Grid is undefined` | Frappe not loaded | Refresh page |
| `Cannot read property 'grid' of undefined` | Field doesn't exist | Check field name |
| `Maximum call stack size exceeded` | Infinite loop | Disable app, report bug |

- [ ] Errors resolved

### Issue: Row click doesn't work

**Symptoms**: Clicking row opens editor instead of linked doc

**Solution**:
1. Check if child doctype has a Link field
2. Open browser console and type:
   ```javascript
   cur_frm.fields_dict.items.grid.enhanced_config
   ```
3. Check `primary_link_field` value

**If no Link field**:
```javascript
// Manually set in custom script
frm.fields_dict.items.grid.configure_enhanced_grid({
    primary_link_field: 'your_link_field'
});
```

- [ ] Link field exists
- [ ] Configuration correct

### Issue: Performance slow

**Symptoms**: Grid is sluggish, especially with many rows

**Solution**:
```javascript
// Disable expensive features
frm.fields_dict.items.grid.configure_enhanced_grid({
    enable_grouping: false,
    show_row_actions: false
});
```

- [ ] Performance acceptable

## Post-Installation

### 1. Configure for Your Doctypes

Create custom scripts for your main doctypes:

**Example**: Sales Order
```javascript
// File: custom_app/public/js/sales_order.js
frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                primary_link_field: 'item_code',
                show_add_dialog: true,
                enable_sorting: true
            });
        }
    }
});
```

- [ ] Custom scripts created
- [ ] Scripts tested

### 2. Train Users

Provide users with:
- [ ] 5-minute demo
- [ ] Quick reference card
- [ ] Link to documentation

**Key Points to Cover**:
1. Click row to open linked document
2. Shift+Click for row editor
3. Click column headers to sort
4. Hover for quick actions

### 3. Monitor Usage

For the first week:
- [ ] Check for user feedback
- [ ] Monitor browser console for errors
- [ ] Watch for performance issues
- [ ] Collect improvement suggestions

## Success Criteria

Installation is successful when:

- [x] All files present
- [x] No console errors
- [x] Row click opens linked doc
- [x] Shift+Click opens editor
- [x] Column sorting works
- [x] Link fields are clickable
- [x] Row actions appear on hover
- [x] Users report improved UX

## Rollback Plan

If you need to uninstall:

```bash
# Uninstall from site
bench --site your-site uninstall-app tablez

# Remove app
bench remove-app tablez

# Clear cache
bench clear-cache

# Restart
bench restart
```

**Note**: Uninstalling is safe - no data is lost, only the enhancements are removed.

## Next Steps

After successful installation:

1. **Read Documentation**:
   - [ ] [QUICK_START.md](QUICK_START.md) - Testing guide
   - [ ] [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) - Configuration examples
   - [ ] [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Technical details

2. **Explore Examples**:
   - [ ] [examples/sales_order_example.js](examples/sales_order_example.js)
   - [ ] [examples/bom_example.js](examples/bom_example.js)

3. **Customize**:
   - [ ] Configure for your main doctypes
   - [ ] Add custom buttons if needed
   - [ ] Adjust styling to match your brand

4. **Share Feedback**:
   - [ ] Report bugs on GitHub
   - [ ] Suggest features
   - [ ] Share your use cases

## Support

If you encounter issues:

1. **Check Documentation**: Most questions are answered in the docs
2. **Browser Console**: Look for error messages (F12)
3. **GitHub Issues**: Search existing issues or create new one
4. **Frappe Forum**: Ask the community
5. **Email**: support@tierneymorris.com.au

## Checklist Summary

### Installation
- [ ] App installed
- [ ] Assets built
- [ ] Cache cleared
- [ ] Bench restarted

### Verification
- [ ] Files present
- [ ] Console messages correct
- [ ] No errors

### Testing
- [ ] Row click works
- [ ] Shift+Click works
- [ ] Sorting works
- [ ] Link fields clickable
- [ ] Row actions visible

### Post-Installation
- [ ] Custom scripts created
- [ ] Users trained
- [ ] Monitoring in place

### Documentation
- [ ] Read QUICK_START.md
- [ ] Read USAGE_EXAMPLES.md
- [ ] Reviewed examples

## Completion

**Installation Date**: _______________

**Installed By**: _______________

**Site**: _______________

**Status**: ⬜ Success  ⬜ Issues (describe below)

**Notes**:
```
_________________________________________________
_________________________________________________
_________________________________________________
```

---

**Congratulations! Tablez is now installed and ready to use! 🎉**

