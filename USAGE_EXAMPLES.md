# Tablez - Usage Examples

## Quick Start

Once installed, Tablez automatically enhances all child tables in your Frappe instance with improved UX features.

## Installation

1. **Install the app** in your Frappe bench:
```bash
cd ~/frappe-bench
bench get-app https://github.com/yourusername/tablez
bench --site your-site install-app tablez
```

2. **Build assets**:
```bash
bench build --app tablez
```

3. **Clear cache**:
```bash
bench clear-cache
```

4. **Restart bench**:
```bash
bench restart
```

## Default Behavior

After installation, all child tables automatically get these enhancements:

### 1. Click Row to Open Linked Document
- Click anywhere on a row to open the primary linked document
- The primary link is auto-detected (first Link field in the child doctype)
- **Shift+Click** to open the row editor (old behavior)
- **Ctrl+Click** (or Cmd+Click on Mac) to open in new tab

### 2. Enhanced Link Fields
- Entire link field cell is clickable (not just the tiny arrow)
- Visual indicator (🔗) appears on link fields
- Hover effect shows the field is clickable
- Click to open the linked document

### 3. Column Sorting
- Click column headers to sort
- Click again to reverse sort
- Click third time to remove sort
- **Shift+Click** for multi-column sorting

### 4. Row Actions on Hover
- Hover over a row to see quick action buttons
- Duplicate row
- Insert row above
- Insert row below

## Custom Configuration

### Example 1: Sales Order Items Table

Configure the items table in Sales Order to open Item documents when clicking rows:

```javascript
// File: custom_app/public/js/sales_order.js

frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
        // Configure items table
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                primary_link_field: 'item_code',  // Click row to open Item
                show_add_dialog: true,             // Show dialog when adding rows
                enable_sorting: true,              // Enable column sorting
                enable_grouping: false,            // Disable grouping
                enhanced_link_clicks: true,        // Make link fields more clickable
                show_row_actions: true             // Show action buttons on hover
            });
        }
    }
});
```

### Example 2: Purchase Order with Add Dialog

Show a dialog when adding items to pre-fill common fields:

```javascript
// File: custom_app/public/js/purchase_order.js

frappe.ui.form.on('Purchase Order', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                primary_link_field: 'item_code',
                show_add_dialog: true,  // Enable add dialog
                enable_sorting: true
            });
        }
    }
});
```

When users click "Add Row", they'll see a dialog with all fields from the child doctype, making it easier to fill in data before adding the row.

### Example 3: Disable Enhanced Grid for Specific Table

If you want to disable the enhanced grid for a specific table:

```javascript
frappe.ui.form.on('My DocType', {
    refresh: function(frm) {
        // Disable enhanced grid for this specific table
        if (frm.fields_dict.my_table && frm.fields_dict.my_table.grid) {
            frm.fields_dict.my_table.grid.disable_enhanced_grid();
        }
    }
});
```

### Example 4: Custom Primary Link Field

If your child table has multiple Link fields, specify which one should open on row click:

```javascript
frappe.ui.form.on('Project', {
    refresh: function(frm) {
        // In project tasks, open the Task document (not the User)
        if (frm.fields_dict.tasks && frm.fields_dict.tasks.grid) {
            frm.fields_dict.tasks.grid.configure_enhanced_grid({
                primary_link_field: 'task',  // Not 'assigned_to'
                enable_sorting: true
            });
        }
    }
});
```

### Example 5: Enable Grouping

Group rows by a specific field:

```javascript
frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                enable_grouping: true,
                group_by_field: 'item_group'  // Group items by Item Group
            });
        }
    }
});
```

## Advanced Features

### Bulk Operations

Select multiple rows and perform bulk actions:

1. Click the "Bulk Actions" button in the grid toolbar
2. Select rows (checkboxes appear when bulk mode is active)
3. Choose an action:
   - Delete Selected
   - Duplicate Selected
   - Export Selected

### Keyboard Shortcuts

- **Click**: Open primary linked document
- **Shift+Click**: Open row editor (traditional behavior)
- **Ctrl+Click** (Cmd+Click on Mac): Open linked document in new tab
- **Shift+Click on column header**: Multi-column sort

### Row Actions

Hover over any row to see quick action buttons:
- **Duplicate**: Create a copy of the row
- **Insert Above**: Add a new row above the current row
- **Insert Below**: Add a new row below the current row

## Configuration Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | Boolean | `true` | Enable/disable enhanced grid |
| `primary_link_field` | String | Auto-detect | Field to open when row is clicked |
| `show_add_dialog` | Boolean | `false` | Show dialog when adding rows |
| `enable_sorting` | Boolean | `true` | Enable column sorting |
| `enable_grouping` | Boolean | `false` | Enable row grouping |
| `group_by_field` | String | `null` | Field to group by |
| `enhanced_link_clicks` | Boolean | `true` | Make entire link cell clickable |
| `show_row_actions` | Boolean | `true` | Show action buttons on hover |
| `allow_row_reorder` | Boolean | `true` | Allow drag-and-drop reordering |

## Styling Customization

You can customize the appearance by adding CSS to your custom app:

```css
/* File: custom_app/public/css/custom_grid.css */

/* Change row hover color */
.grid-row:hover {
    background-color: #e3f2fd !important;
}

/* Customize link field hover */
.grid-body [data-fieldtype="Link"]:hover {
    background-color: #fff3e0 !important;
}

/* Change action button style */
.grid-row-actions .btn {
    background-color: #2196f3;
    color: white;
}
```

Then include it in your hooks.py:
```python
app_include_css = "/assets/custom_app/css/custom_grid.css"
```

## Real-World Examples

### Example: Manufacturing BOM

For a Bill of Materials with items table:

```javascript
frappe.ui.form.on('BOM', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                primary_link_field: 'item_code',
                show_add_dialog: true,
                enable_sorting: true,
                enable_grouping: true,
                group_by_field: 'item_group'
            });
        }
    }
});
```

**User Experience:**
- Click any row to open the Item master
- Add items via dialog with all fields visible
- Sort by quantity, rate, or any column
- Group items by Item Group for better organization

### Example: Timesheet with Activities

```javascript
frappe.ui.form.on('Timesheet', {
    refresh: function(frm) {
        if (frm.fields_dict.time_logs && frm.fields_dict.time_logs.grid) {
            frm.fields_dict.time_logs.grid.configure_enhanced_grid({
                primary_link_field: 'project',  // Click to open Project
                show_add_dialog: false,         // Quick add without dialog
                enable_sorting: true,
                show_row_actions: true
            });
        }
    }
});
```

### Example: Quotation Items with Custom Behavior

```javascript
frappe.ui.form.on('Quotation', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            const grid = frm.fields_dict.items.grid;
            
            // Configure enhanced grid
            grid.configure_enhanced_grid({
                primary_link_field: 'item_code',
                show_add_dialog: true,
                enable_sorting: true
            });
            
            // Add custom button to grid toolbar
            grid.grid_buttons.prepend(
                $('<button class="btn btn-xs btn-secondary">')
                    .text(__('Import from Template'))
                    .on('click', function() {
                        // Your custom logic
                        frappe.msgprint('Import from template');
                    })
            );
        }
    }
});
```

## Troubleshooting

### Grid not enhancing

**Problem**: Child tables look the same as before.

**Solutions**:
1. Clear cache: `bench clear-cache`
2. Rebuild assets: `bench build --app tablez`
3. Hard refresh browser (Ctrl+Shift+R)
4. Check browser console for JavaScript errors

### Row click not working

**Problem**: Clicking rows doesn't open linked documents.

**Solutions**:
1. Check if the child doctype has a Link field
2. Verify the `primary_link_field` is set correctly
3. Check if the link field has a value
4. Try Shift+Click to see if row editor opens (confirms click is working)

### Conflicts with custom scripts

**Problem**: Custom scripts stop working after installing Tablez.

**Solutions**:
1. Check if custom scripts are modifying the same Grid methods
2. Ensure custom scripts run after Tablez loads
3. Use `disable_enhanced_grid()` for specific tables if needed

### Performance issues

**Problem**: Grid is slow with many rows.

**Solutions**:
1. Disable grouping: `enable_grouping: false`
2. Disable row actions: `show_row_actions: false`
3. Use Frappe's built-in pagination (default: 50 rows per page)

## Best Practices

1. **Test thoroughly**: Test with different doctypes and scenarios
2. **Configure per doctype**: Don't enable all features everywhere
3. **User training**: Inform users about new keyboard shortcuts
4. **Gradual rollout**: Enable features incrementally
5. **Monitor performance**: Watch for slowdowns with large tables

## Getting Help

- Check the [Implementation Guide](IMPLEMENTATION_GUIDE.md) for technical details
- Report issues on GitHub
- Join the discussion on Frappe Forum

## Contributing

We welcome contributions! Please see the main README for contribution guidelines.

