# Tablez - Quick Start Guide

## 5-Minute Setup

### Step 1: Install the App

```bash
cd ~/frappe-bench
bench get-app /path/to/tablez
bench --site your-site install-app tablez
```

### Step 2: Build Assets

```bash
bench build --app tablez
```

### Step 3: Clear Cache

```bash
bench clear-cache
```

### Step 4: Restart

```bash
bench restart
```

### Step 5: Test It!

1. Open any doctype with a child table (e.g., Sales Order)
2. Notice the improvements:
   - Click anywhere on a row → opens the linked document
   - Click column headers → sorts the table
   - Hover over rows → see quick action buttons
   - Link fields are fully clickable (not just tiny arrows)

## Testing the Features

### Test 1: Smart Row Click

1. Open a **Sales Order**
2. Go to the **Items** table
3. **Click anywhere on a row** → Should open the Item document
4. **Shift+Click on a row** → Should open the row editor (old behavior)
5. **Ctrl+Click on a row** → Should open Item in new tab

✅ **Expected**: Clicking rows opens Item documents, not row editor

### Test 2: Enhanced Link Fields

1. In the same Items table
2. Find a link field (e.g., "Item Code")
3. **Hover over the link** → Should see hover effect and 🔗 icon
4. **Click anywhere in the cell** → Should open the Item

✅ **Expected**: Entire cell is clickable, not just tiny arrow

### Test 3: Column Sorting

1. In the Items table
2. **Click the "Qty" column header** → Should sort ascending
3. **Click again** → Should sort descending
4. **Click third time** → Should remove sort

✅ **Expected**: Table sorts by clicked column

### Test 4: Row Actions

1. **Hover over any row** in the Items table
2. Should see action buttons appear on the right:
   - 📋 Duplicate
   - ⬆️ Insert Above
   - ⬇️ Insert Below
3. **Click Duplicate** → Should create a copy of the row

✅ **Expected**: Action buttons appear on hover and work

### Test 5: Add Row with Dialog (Optional)

This requires configuration. Add this to a custom script:

```javascript
// File: custom_app/public/js/sales_order.js
frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                show_add_dialog: true
            });
        }
    }
});
```

Then:
1. Reload the Sales Order
2. **Click "Add Row"** → Should show a dialog with all fields
3. Fill in the fields and click "Add"

✅ **Expected**: Dialog appears before adding row

## Common Doctypes to Test

### Sales Order
- Items table with Item links
- Click rows to open Items
- Sort by quantity, rate, amount

### Purchase Order
- Items table with Item and Supplier links
- Configure to open Item on row click
- Use add dialog for better data entry

### BOM (Bill of Materials)
- Items table with grouping by Item Group
- Sort by quantity
- Duplicate common items

### Timesheet
- Time Logs table with Project links
- Click to open Projects
- Sort by hours

### Stock Entry
- Items table with Item and Warehouse links
- Quick access to Item masters
- Bulk operations

## Verification Checklist

After installation, verify these features work:

- [ ] Row click opens linked document (not row editor)
- [ ] Shift+Click opens row editor
- [ ] Ctrl+Click opens in new tab
- [ ] Link fields are fully clickable
- [ ] Link fields show 🔗 icon
- [ ] Column headers are clickable
- [ ] Sorting works (asc/desc/none)
- [ ] Row actions appear on hover
- [ ] Duplicate row works
- [ ] Insert above/below works
- [ ] Browser console has no errors

## Troubleshooting

### Issue: Nothing changed

**Solution**:
```bash
# Clear cache thoroughly
bench clear-cache
bench clear-website-cache

# Rebuild assets
bench build --app tablez

# Hard refresh browser
# Chrome/Firefox: Ctrl+Shift+R
# Mac: Cmd+Shift+R
```

### Issue: JavaScript errors in console

**Solution**:
1. Open browser console (F12)
2. Check for errors
3. Verify files are loaded:
   - `/assets/tablez/js/enhanced_grid.js`
   - `/assets/tablez/js/enhanced_grid_row.js`
   - `/assets/tablez/css/enhanced_grid.css`

### Issue: Row click doesn't work

**Solution**:
1. Check if child doctype has a Link field
2. Open browser console and type:
   ```javascript
   cur_frm.fields_dict.items.grid.enhanced_config
   ```
3. Should show configuration object
4. Check `primary_link_field` value

### Issue: Conflicts with custom scripts

**Solution**:
```javascript
// Disable for specific table
frappe.ui.form.on('My DocType', {
    refresh: function(frm) {
        frm.fields_dict.my_table.grid.disable_enhanced_grid();
    }
});
```

## Next Steps

### 1. Configure for Your Doctypes

Create custom scripts to configure enhanced grid for your specific needs:

```javascript
// Example: Configure Sales Order items
frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                primary_link_field: 'item_code',
                show_add_dialog: true,
                enable_sorting: true,
                enable_grouping: false
            });
        }
    }
});
```

### 2. Customize Styling

Add custom CSS to match your brand:

```css
/* File: custom_app/public/css/custom_grid.css */
.grid-row:hover {
    background-color: #e3f2fd !important;
}
```

### 3. Train Users

Inform your users about:
- Click rows to open linked documents
- Shift+Click for row editor
- Ctrl+Click for new tab
- Column sorting
- Row action buttons

### 4. Monitor Performance

Watch for:
- Slow loading with large tables (>100 rows)
- JavaScript errors in console
- User feedback on UX changes

## Advanced Configuration

### Per-Doctype Configuration

Create a configuration file for each doctype:

```javascript
// File: custom_app/public/js/doctype_configs/sales_order_config.js

frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
        // Items table
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                primary_link_field: 'item_code',
                show_add_dialog: true,
                enable_sorting: true
            });
        }

        // Taxes table (disable enhanced grid)
        if (frm.fields_dict.taxes && frm.fields_dict.taxes.grid) {
            frm.fields_dict.taxes.grid.disable_enhanced_grid();
        }
    }
});
```

### Global Configuration

Set defaults for all grids:

```javascript
// File: custom_app/public/js/global_grid_config.js

$(document).on('form-load', function() {
    // Wait for form to load
    setTimeout(function() {
        // Configure all grids
        if (cur_frm) {
            Object.keys(cur_frm.fields_dict).forEach(function(fieldname) {
                const field = cur_frm.fields_dict[fieldname];
                if (field.df.fieldtype === 'Table' && field.grid) {
                    field.grid.configure_enhanced_grid({
                        enable_sorting: true,
                        show_row_actions: true
                    });
                }
            });
        }
    }, 500);
});
```

## Performance Tips

### For Large Tables (>100 rows)

```javascript
frm.fields_dict.items.grid.configure_enhanced_grid({
    enable_grouping: false,      // Disable grouping
    show_row_actions: false,     // Disable row actions
    enable_sorting: true         // Keep sorting (it's fast)
});
```

### For Mobile Users

The enhanced grid is responsive, but you can optimize:

```javascript
// Detect mobile and adjust config
const is_mobile = window.innerWidth < 768;

frm.fields_dict.items.grid.configure_enhanced_grid({
    show_row_actions: !is_mobile,  // Hide on mobile
    enable_sorting: true
});
```

## Getting Help

### Check Logs

```bash
# Frappe logs
tail -f ~/frappe-bench/sites/your-site/logs/web.log

# Browser console
# Press F12 and check Console tab
```

### Debug Mode

Enable debug mode to see more details:

```javascript
// In browser console
frappe.ui.form.Grid.prototype.debug = true;
```

### Community Support

- **GitHub Issues**: Report bugs and feature requests
- **Frappe Forum**: Ask questions and share experiences
- **Email**: support@tierneymorris.com.au

## Success Criteria

You'll know it's working when:

✅ Users can click rows to open linked documents  
✅ Link fields are easier to click (no tiny arrows)  
✅ Tables can be sorted by clicking headers  
✅ Row actions appear on hover  
✅ No JavaScript errors in console  
✅ Users report improved UX  

## What's Next?

- Read the [Implementation Guide](IMPLEMENTATION_GUIDE.md) for technical details
- Check [Usage Examples](USAGE_EXAMPLES.md) for real-world scenarios
- Customize for your specific use cases
- Provide feedback and contribute!

---

**Happy Frappe-ing! 🎉**

