# Tablez Testing Guide

Complete guide for testing Tablez grid enhancements using the test DocTypes.

## Overview

Three DocTypes are provided for comprehensive testing:

1. **Tablez Product** - Master DocType for products
2. **Tablez Test Item** - Child table with link to products
3. **Tablez Test** - Parent DocType with enhanced grid

## Quick Start

### Step 1: Install DocTypes

```bash
bench --site your-site migrate
```

This installs all three DocTypes.

### Step 2: Create Sample Products

**Option A: Using bench console**
```bash
bench --site your-site console
```

Then run:
```python
from tablez.tablez.doctype.tablez_product.sample_products import create_sample_products
create_sample_products()
exit()
```

**Option B: Using bench execute**
```bash
bench --site your-site execute tablez.tablez.doctype.tablez_product.sample_products.create_sample_products
```

This creates 15 sample products (laptops, chairs, monitors, etc.).

### Step 3: Create a Test Document

1. Go to **Tablez Test** list
2. Click **New**
3. Enter a title (e.g., "Test Order 1")
4. Click **Save**

### Step 4: Configure the Grid

1. Click **Configure Grid** button in the toolbar
2. Adjust settings (or keep defaults)
3. Click **Apply**

### Step 5: Test Features

1. Click **Add Item** button
2. Select a product (e.g., "Laptop - Dell XPS 15")
3. Notice auto-population of fields
4. Enter quantity (e.g., 2)
5. Amount calculates automatically
6. Click **Save** button (appears in grid)
7. Save button disappears after save ✨

## Testing Scenarios

### Scenario 1: Basic Add/Edit/Save Flow

**Configuration:**
- Enable: Show Add Button, Show Save Button
- Add Button Action: inline

**Steps:**
1. Click "Add Item"
2. Select product
3. Enter quantity
4. **Save button appears**
5. Click Save button
6. **Save button disappears** ✨
7. Row styling returns to normal ✨

**Expected Result:**
- ✅ Item added inline
- ✅ Save button appears when dirty
- ✅ Save button disappears after save
- ✅ Row styling updates correctly

---

### Scenario 2: Link Field Auto-Population

**Configuration:**
- Primary Link Field: item_name

**Steps:**
1. Add item
2. Click Item Name field
3. Select "Monitor - 27 inch 4K"
4. Observe auto-population

**Expected Result:**
- ✅ Item Code: MON-27-4K
- ✅ Category: Electronics
- ✅ Rate: 399.99
- ✅ Description: "27-inch 4K UHD monitor..."

---

### Scenario 3: Quick Entry for New Products

**Steps:**
1. Add item
2. Click Item Name field
3. Click "Create a new Tablez Product"
4. Fill quick entry form:
   - Product Name: "New Product"
   - Category: Electronics
   - Default Rate: 99.99
5. Click Save
6. Product is created and selected

**Expected Result:**
- ✅ Quick entry dialog opens
- ✅ Product is created
- ✅ Product is selected in grid
- ✅ Fields auto-populate

---

### Scenario 4: Total Row

**Configuration:**
- Enable: Show Total Row

**Steps:**
1. Add multiple items with quantities
2. Scroll to bottom of grid

**Expected Result:**
- ✅ Total row appears at bottom
- ✅ Shows sum of Quantity column
- ✅ Shows sum of Amount column
- ✅ Updates automatically when values change

---

### Scenario 5: Add Button Action - Link

**Configuration:**
- Add Button Action: link
- Primary Link Field: item_name

**Steps:**
1. Click "Add Item" button

**Expected Result:**
- ✅ Opens new Tablez Product form
- ✅ Can create product
- ✅ After save, can select it in grid

---

### Scenario 6: Add Button Action - Dialog

**Configuration:**
- Add Button Action: dialog
- Show Add Dialog: true

**Steps:**
1. Click "Add Item" button

**Expected Result:**
- ✅ Opens dialog with all fields
- ✅ Can fill in values
- ✅ Click Add to add row

---

### Scenario 7: Row Sorting

**Configuration:**
- Enable Sorting: true

**Steps:**
1. Add multiple items
2. Click "Item Name" column header
3. Click again

**Expected Result:**
- ✅ First click: Sort ascending
- ✅ Second click: Sort descending
- ✅ Works for all columns

---

### Scenario 8: Row Reordering

**Configuration:**
- Allow Row Reorder: true

**Steps:**
1. Add multiple items
2. Drag a row by the handle
3. Drop in new position

**Expected Result:**
- ✅ Row moves to new position
- ✅ idx values update
- ✅ Form becomes dirty

---

### Scenario 9: Hide Default Elements

**Configuration:**
- Hide Row Numbers: true
- Hide Checkboxes: true
- Hide Edit Icon: true
- Hide Add Row Button: true

**Steps:**
1. Apply configuration
2. Observe grid

**Expected Result:**
- ✅ Row numbers hidden
- ✅ Checkboxes hidden
- ✅ Edit icons hidden
- ✅ Default "Add Row" button hidden
- ✅ Cleaner appearance

---

### Scenario 10: Confirm Delete

**Configuration:**
- Confirm Delete: true
- Show Delete Button: true

**Steps:**
1. Add item
2. Click delete button
3. Observe confirmation dialog

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ Can cancel
- ✅ Can confirm
- ✅ Row deleted only after confirmation

---

### Scenario 11: Multiple Grids - Selective Enhancement

**Purpose:** Verify that Tablez enhancements only apply to configured grids, not all grids on the form.

**Configuration:**
- Items grid: Tablez enabled
- Test Notes grid: Vanilla Frappe (no Tablez)

**Steps:**
1. Open Tablez Test document
2. Observe **Items** grid (top):
   - Has "Add Item" button
   - Has "Save" button (when dirty)
   - Has total row
   - Has Tablez styling
3. Observe **Test Notes** grid (bottom):
   - Standard Frappe "Add Row" button
   - No custom save button
   - No total row
   - Standard Frappe styling
4. Add items to both grids
5. Compare behavior

**Expected Result:**
- ✅ Items grid has all Tablez enhancements
- ✅ Test Notes grid is vanilla Frappe
- ✅ Both grids work independently
- ✅ No interference between grids
- ✅ Form save button saves both grids

**Why This Matters:**
This proves that Tablez can coexist with vanilla Frappe grids on the same form without conflicts.

---

## Configuration Options Reference

### Basic Settings
- **Enable Tablez**: Master on/off switch
- **Primary Link Field**: Field to use for link actions
- **Show Save Button**: Display save button when dirty
- **Confirm Delete**: Ask before deleting

### Add Button
- **Show Add Button**: Display custom add button
- **Add Button Label**: Button text
- **Add Button Action**: inline/dialog/link
- **Hide Add Row Button**: Hide Frappe's default button

### Row Features
- **Enable Sorting**: Click headers to sort
- **Enable Grouping**: Group rows by field
- **Allow Row Reorder**: Drag to reorder
- **Show Row Actions**: Action buttons per row
- **Show Edit Button**: Show edit icon for linked records
- **Show Delete Button**: Show delete icon for rows

### Row Click
- **Enable Row Click**: Make rows clickable
- **Row Click Action**: open_document/open_editor
- **Row Shift Click Action**: Alternative action with Shift key

### Display
- **Show Total Row**: Display totals at bottom
- **Auto Column Width**: Automatically distribute column widths evenly
- **Actions Column Width**: Width of actions column ('auto' or CSS value)
- **Hide Row Numbers**: Hide idx column
- **Hide Checkboxes**: Hide selection boxes
- **Hide Edit Icon**: Hide edit icons

---

## Example Configuration Script

Here's the complete configuration used in **Tablez Test** (from `tablez_test.js`):

```javascript
frappe.ui.form.on('Tablez Test', {
    refresh: function(frm) {
        // Wait for Tablez to load
        setTimeout(function() {
            if (frm.fields_dict.items && frm.fields_dict.items.grid) {
                const grid = frm.fields_dict.items.grid;

                // Check if configure_enhanced_grid is available
                if (typeof grid.configure_enhanced_grid === 'function') {
                    // Get saved config or use defaults
                    const config = get_saved_config();

                    // Apply configuration
                    grid.configure_enhanced_grid(config);
                }
            }
        }, 100);
    }
});

function get_saved_config() {
    // Try to load saved config from localStorage
    const saved = localStorage.getItem('tablez_test_config');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse saved config:', e);
        }
    }

    // Default configuration
    return {
        // Basic Settings
        enabled: true,
        primary_link_field: 'item_name',
        show_save_button: true,
        confirm_delete: true,

        // Add Button Settings
        show_add_button: true,
        add_button_label: 'Add Item',
        add_button_action: 'inline',  // Options: 'inline', 'dialog', 'link'
        hide_add_row_button: true,

        // Row Features
        enable_sorting: true,
        enable_grouping: false,
        allow_row_reorder: true,
        show_row_actions: false,
        show_edit_button: false,
        show_delete_button: false,

        // Row Click Settings
        enable_row_click: false,
        row_click_action: 'open_document',
        row_shift_click_action: 'open_editor',
        enhanced_link_clicks: false,

        // Total Row Settings
        show_total_row: true,
        total_row_config: {
            label: 'Total',
            columns: {
                quantity: 'sum',
                amount: 'sum'
            },
            style: {
                background: '#f8f9fa',
                fontWeight: 'bold',
                borderTop: '2px solid #dee2e6'
            }
        },

        // Column Width Settings
        column_widths: null,  // Or specify: { item_name: '200px', quantity: '100px' }
        auto_column_width: false,  // Set to true for automatic even distribution
        actions_column_width: 'auto',  // Auto-calculates based on enabled buttons

        // Display Settings
        hide_row_numbers: false,
        hide_checkboxes: false,
        hide_edit_icon: false,

        // Custom CSS
        custom_css: null
    };
}
```

### Key Configuration Notes

**Add Button Action Options:**
- `'inline'` - Adds row directly in the grid (fastest)
- `'dialog'` - Opens a dialog form with all fields (best for complex forms)
- `'link'` - Opens the linked DocType's new form (for creating master records)

**Actions Column Width:**
- `'auto'` - Automatically calculates based on enabled buttons (recommended)
- `'120px'` - Manual pixel value
- Calculation: Base (20px) + Edit (40px) + Delete (40px) + Save (80px) + gaps

**Auto Column Width:**
- When `true`, all data columns get equal width
- Accounts for hidden columns (row numbers, checkboxes)
- Reserves space for actions column
- Uses CSS flexbox for perfect fit (no gaps)

**Total Row Config:**
- `columns`: Object mapping fieldname to aggregation type
- Aggregation types: `'sum'`, `'avg'`, `'count'`, `'min'`, `'max'`
- `style`: CSS properties for the total row

---

## Troubleshooting

### Save Button Not Appearing
- Check: Show Save Button is enabled
- Check: Form is dirty (make a change)
- Check: Browser console for errors

### Save Button Not Disappearing
- Check: Save was successful (no validation errors)
- Check: Browser console for "[Tablez]" logs
- Wait 300ms after save

### Auto-Population Not Working
- Check: Product exists
- Check: Browser console for errors
- Check: item_name field is Link type

### Total Row Not Showing
- Check: Show Total Row is enabled
- Check: total_row_config has correct columns
- Refresh grid

### Configuration Not Persisting
- Check: localStorage is enabled
- Check: Same browser/device
- Try: Clear localStorage and reconfigure

## Sample Products

The sample products script creates:

| Product | Code | Category | Rate |
|---------|------|----------|------|
| Laptop - Dell XPS 15 | DELL-XPS-15 | Electronics | $1,299.99 |
| Office Chair - Ergonomic | CHAIR-ERG-001 | Furniture | $299.99 |
| Wireless Mouse | MOUSE-WL-001 | Electronics | $29.99 |
| Standing Desk | DESK-STD-001 | Furniture | $499.99 |
| Monitor - 27 inch 4K | MON-27-4K | Electronics | $399.99 |
| Mechanical Keyboard | KB-MECH-001 | Electronics | $149.99 |
| Desk Lamp - LED | LAMP-LED-001 | Electronics | $49.99 |
| Bookshelf - 5 Tier | SHELF-5T-001 | Furniture | $89.99 |
| Coffee Mug - Insulated | MUG-INS-001 | Other | $19.99 |
| Notebook - A4 | NOTE-A4-001 | Other | $4.99 |
| Headphones - Noise Cancelling | HP-NC-001 | Electronics | $249.99 |
| Webcam - 1080p | CAM-1080-001 | Electronics | $79.99 |
| Filing Cabinet - 3 Drawer | CAB-3D-001 | Furniture | $199.99 |
| Whiteboard - 4x6 ft | WB-4X6-001 | Other | $129.99 |
| USB Hub - 7 Port | USB-HUB-7P | Electronics | $34.99 |

## Next Steps

After testing with the provided DocTypes:

1. **Review the code** in `tablez_test.js` to see how configuration works
2. **Apply to your own DocTypes** using similar patterns
3. **Customize** the configuration for your use cases
4. **Report issues** or suggest improvements

## Files Reference

```
tablez/tablez/doctype/
├── tablez_product/
│   ├── tablez_product.json
│   ├── tablez_product.py
│   ├── sample_products.py      # Sample data script
│   └── README.md
├── tablez_test_item/
│   ├── tablez_test_item.json   # Child table with Link field
│   └── tablez_test_item.py
└── tablez_test/
    ├── tablez_test.json        # Parent DocType
    ├── tablez_test.py          # Auto-calculation logic
    ├── tablez_test.js          # Tablez configuration
    └── README.md
```

---

**Happy Testing!** 🎉

