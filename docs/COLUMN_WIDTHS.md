# Column Width Configuration

## Overview

The column width feature allows you to define exact widths for each column in your child table, overriding Frappe's default Bootstrap grid system. This ensures perfect alignment across all rows (header, data, total, and add rows).

## Why Use Custom Column Widths?

1. **Perfect Alignment**: Ensures all rows align perfectly, especially when using total rows
2. **Override Bootstrap**: Bootstrap's `col-xs-*` classes can cause alignment issues when columns are hidden or when using custom features
3. **Precise Control**: Define exact widths in percentages or pixels
4. **Consistent Layout**: Same widths applied to header, data, total, and add rows

## Configuration

### Basic Usage

```javascript
frappe.ui.form.on('Your DocType', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                enabled: true,
                column_widths: {
                    'item_code': '25%',
                    'item_name': '30%',
                    'qty': '10%',
                    'rate': '15%',
                    'amount': '20%'
                },
                actions_column_width: '120px'
            });
        }
    }
});
```

### Configuration Options

#### `column_widths`
- **Type**: Object or null
- **Default**: null (uses Bootstrap defaults)
- **Format**: `{ fieldname: width, ... }`
- **Width values**: 
  - Percentages: `'25%'`, `'33.33%'`, etc.
  - Pixels: `'150px'`, `'200px'`, etc.

#### `actions_column_width`
- **Type**: String
- **Default**: `'120px'`
- **Format**: CSS width value (e.g., `'120px'`, `'10%'`)

## Examples

### Example 1: Percentage-Based Widths

```javascript
column_widths: {
    'activity': '40%',
    'total_labour_sell': '15%',
    'total_purchase_sell': '15%',
    'total_margin': '10%',
    'total_sell': '15%'
}
// Total: 95% (leaving 5% for padding/spacing)
```

### Example 2: Pixel-Based Widths

```javascript
column_widths: {
    'item_code': '150px',
    'item_name': '300px',
    'qty': '100px',
    'rate': '120px',
    'amount': '150px'
}
```

### Example 3: Mixed Widths

```javascript
column_widths: {
    'item_code': '200px',    // Fixed width for code
    'item_name': '40%',      // Flexible width for name
    'qty': '10%',
    'rate': '15%',
    'amount': '20%'
}
```

### Example 4: With Total Row

```javascript
frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                enabled: true,
                show_total_row: true,
                total_row_config: {
                    label: 'Total',
                    columns: {
                        'qty': 'sum',
                        'amount': 'sum'
                    }
                },
                column_widths: {
                    'item_code': '20%',
                    'item_name': '35%',
                    'qty': '10%',
                    'rate': '15%',
                    'amount': '20%'
                },
                actions_column_width: '120px'
            });
        }
    }
});
```

## How It Works

1. **Applied to All Rows**: The widths are applied to:
   - Header row
   - All data rows
   - Total row (if enabled)
   - Add row (if enabled)

2. **CSS Properties Set**: For each column, the following CSS is applied:
   ```css
   width: <your-width>;
   min-width: <your-width>;
   max-width: <your-width>;
   flex: 0 0 <your-width>;
   ```

3. **Overrides Bootstrap**: These inline styles override Bootstrap's `col-xs-*` classes

## Tips for Calculating Widths

### Using Percentages

1. Count your visible data columns (exclude row numbers, checkboxes, actions)
2. Decide the percentage for each column
3. Make sure they add up to 95-100% (leaving room for padding)

Example for 5 columns:
- Equal widths: 20% each = 100%
- Varied widths: 40% + 15% + 15% + 10% + 15% = 95%

### Using Pixels

1. Estimate the total available width (e.g., 1200px for a typical form)
2. Subtract the actions column width (e.g., 120px)
3. Distribute the remaining width among data columns

Example:
- Total width: 1200px
- Actions: 120px
- Remaining: 1080px
- Distribute: 300px + 200px + 200px + 180px + 200px = 1080px

## Troubleshooting

### Columns Still Not Aligned

1. **Check if widths are defined for all visible columns**
   - Every column with a `data-fieldname` should have a width defined
   - Don't forget any columns!

2. **Verify percentages add up correctly**
   - Should total 95-100%
   - Too much = horizontal scrollbar
   - Too little = extra space

3. **Check for hidden columns**
   - Make sure `hide_row_numbers` and `hide_checkboxes` are set correctly
   - Hidden columns are automatically removed from the DOM

4. **Inspect the actions column**
   - Should have `tablez-actions-column` class
   - Should have the width specified in `actions_column_width`

### Horizontal Scrollbar Appears

- Your column widths add up to more than 100%
- Reduce some column widths
- Or use pixel widths instead

### Columns Too Narrow

- Your column widths add up to less than 100%
- Increase some column widths
- Or let one column be flexible by not defining its width

## Browser DevTools Inspection

To debug alignment issues:

1. Open browser DevTools (F12)
2. Inspect a column in the total row
3. Check the computed styles:
   - `width`, `min-width`, `max-width`, `flex`
4. Compare with the same column in a data row
5. They should be identical

## Related Features

- [Total Row](./TOTAL_ROW.md) - Display calculated totals
- [Actions Column](./ACTIONS_COLUMN.md) - Custom action buttons
- [Hide Columns](./HIDE_COLUMNS.md) - Hide row numbers and checkboxes

## See Also

- [examples/column_width_fix.js](../examples/column_width_fix.js) - Quick fix example
- [examples/total_row_example.js](../examples/total_row_example.js) - Example 9

