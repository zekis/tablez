/**
 * Total Row Examples
 * 
 * This file demonstrates how to use the total row feature in Tablez.
 * The total row displays calculated values (sum, average, count, min, max) 
 * at the bottom of the table.
 */

// ============================================
// Example 1: Basic Total Row with Sum and Custom Column Widths
// ============================================

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
                // Optional: Define custom column widths (percentage or px)
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

// ============================================
// Example 2: Total Row with Multiple Operations
// ============================================

frappe.ui.form.on('Purchase Order', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                enabled: true,
                show_total_row: true,
                total_row_config: {
                    label: 'Summary',
                    columns: {
                        'qty': 'sum',           // Total quantity
                        'rate': 'average',      // Average rate
                        'amount': 'sum',        // Total amount
                        'stock_qty': 'sum'      // Total stock quantity
                    }
                }
            });
        }
    }
});

// ============================================
// Example 3: Total Row with Custom Styling
// ============================================

frappe.ui.form.on('Invoice', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                enabled: true,
                show_total_row: true,
                total_row_config: {
                    label: 'Grand Total',
                    columns: {
                        'qty': 'sum',
                        'amount': 'sum',
                        'tax_amount': 'sum'
                    },
                    style: {
                        background: '#e3f2fd',      // Light blue background
                        fontWeight: 'bold',
                        borderTop: '3px solid #1976d2'  // Blue border
                    }
                }
            });
        }
    }
});

// ============================================
// Example 4: Total Row with Edit/Delete Buttons
// ============================================

frappe.ui.form.on('Quotation', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                enabled: true,
                show_edit_button: true,
                show_delete_button: true,
                show_total_row: true,
                total_row_config: {
                    label: 'Total',
                    columns: {
                        'qty': 'sum',
                        'amount': 'sum'
                    }
                }
            });
        }
    }
});

// ============================================
// Example 5: Total Row with Add Button
// ============================================

frappe.ui.form.on('Material Request', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                enabled: true,
                show_add_button: true,
                show_total_row: true,
                total_row_config: {
                    label: 'Total',
                    columns: {
                        'qty': 'sum',
                        'stock_qty': 'sum'
                    }
                }
            });
        }
    }
});

// ============================================
// Example 6: Total Row with Min/Max/Count
// ============================================

frappe.ui.form.on('Stock Entry', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                enabled: true,
                show_total_row: true,
                total_row_config: {
                    label: 'Statistics',
                    columns: {
                        'qty': 'sum',           // Total quantity
                        'basic_rate': 'average', // Average rate
                        'amount': 'sum',        // Total amount
                        'valuation_rate': 'max' // Max valuation rate
                    }
                }
            });
        }
    }
});

// ============================================
// Example 7: Complete Configuration
// ============================================

frappe.ui.form.on('Your DocType', {
    refresh: function(frm) {
        if (frm.fields_dict.your_table && frm.fields_dict.your_table.grid) {
            frm.fields_dict.your_table.grid.configure_enhanced_grid({
                enabled: true,
                
                // Total row configuration
                show_total_row: true,
                total_row_config: {
                    label: 'Grand Total',
                    columns: {
                        'quantity': 'sum',
                        'rate': 'average',
                        'amount': 'sum',
                        'discount': 'sum'
                    },
                    style: {
                        background: '#fff3cd',
                        fontWeight: 'bold',
                        borderTop: '2px solid #ffc107'
                    }
                },
                
                // Other features
                show_edit_button: true,
                show_delete_button: true,
                show_add_button: true,
                enable_sorting: true,
                hide_row_numbers: true,
                hide_checkboxes: true
            });
        }
    }
});

// ============================================
// Example 8: Dynamic Total Row (Conditional)
// ============================================

frappe.ui.form.on('Sales Invoice', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            // Only show total row if there are more than 3 items
            const show_total = frm.doc.items && frm.doc.items.length > 3;
            
            frm.fields_dict.items.grid.configure_enhanced_grid({
                enabled: true,
                show_total_row: show_total,
                total_row_config: {
                    label: 'Total',
                    columns: {
                        'qty': 'sum',
                        'amount': 'sum',
                        'net_amount': 'sum'
                    }
                }
            });
        }
    }
});

// ============================================
// Available Operations
// ============================================

/*
Supported operations for total_row_config.columns:

1. 'sum' - Adds all values together
   Example: { 'amount': 'sum' }
   
2. 'average' - Calculates the average of all values
   Example: { 'rate': 'average' }
   
3. 'count' - Counts the number of rows
   Example: { 'item_code': 'count' }
   
4. 'min' - Finds the minimum value
   Example: { 'discount': 'min' }
   
5. 'max' - Finds the maximum value
   Example: { 'price': 'max' }
*/

// ============================================
// Styling Options
// ============================================

/*
Available style options in total_row_config.style:

{
    background: '#f8f9fa',           // Background color
    fontWeight: 'bold',              // Font weight
    borderTop: '2px solid #dee2e6',  // Top border
    color: '#000',                   // Text color (optional)
    fontSize: '14px'                 // Font size (optional)
}
*/

// ============================================
// Notes
// ============================================

/*
1. The total row automatically updates when:
   - Rows are added or deleted
   - Values in configured columns change
   - The grid is refreshed

2. The total row appears BEFORE the Add button row (if enabled)

3. Only numeric fields (Currency, Float, Int, Percent) should be used
   in the columns configuration

4. The label appears in the first DATA column (not row numbers or checkboxes)

5. The Actions column (if enabled) is left empty in the total row

6. The total row respects hidden columns:
   - If hide_row_numbers is true, the total row won't show row numbers
   - If hide_checkboxes is true, the total row won't show checkboxes
   - Hidden columns are properly aligned with data rows

7. Column alignment is automatically maintained to match the data rows

8. Custom column widths (NEW FEATURE):
   - Use column_widths to define exact widths for each column
   - Supports percentages (e.g., '25%') or pixels (e.g., '150px')
   - Overrides Bootstrap's col-xs-* classes for perfect alignment
   - Applied consistently to header, data, total, and add rows
   - Use actions_column_width to set the width of the actions column
*/

// ============================================
// Example 9: Custom Column Widths for Perfect Alignment
// ============================================

frappe.ui.form.on('Activity Section', {
    refresh: function(frm) {
        if (frm.fields_dict.section_01 && frm.fields_dict.section_01.grid) {
            frm.fields_dict.section_01.grid.configure_enhanced_grid({
                enabled: true,
                show_total_row: true,
                total_row_config: {
                    label: 'Total',
                    columns: {
                        'total_labour_sell': 'sum',
                        'total_purchase_sell': 'sum',
                        'total_margin': 'average',
                        'total_sell': 'sum'
                    }
                },
                // Define exact column widths to ensure alignment
                column_widths: {
                    'activity': '33.33%',           // First column
                    'total_labour_sell': '16.67%',  // Currency column
                    'total_purchase_sell': '16.67%', // Currency column
                    'total_margin': '8.33%',        // Percent column
                    'total_sell': '16.67%'          // Currency column
                    // Actions column width is set separately
                },
                actions_column_width: '120px',  // Fixed width for actions
                show_delete_button: true
            });
        }
    }
});

