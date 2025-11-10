/**
 * QUICK FIX FOR ALIGNMENT ISSUES
 * 
 * Use this configuration to fix your current alignment problem.
 * This eliminates the horizontal scrollbar and ensures perfect alignment.
 */

// SOLUTION 1: Use percentages for EVERYTHING (RECOMMENDED)
// This is the most reliable way to avoid horizontal scrollbars

frappe.ui.form.on('Your DocType', {
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
                // Use percentages that add up to 100%
                column_widths: {
                    'activity': '40%',              // 40%
                    'total_labour_sell': '15%',     // 15%
                    'total_purchase_sell': '15%',   // 15%
                    'total_margin': '10%',          // 10%
                    'total_sell': '15%'             // 15%
                    // Subtotal: 95%
                },
                actions_column_width: '5%',         // 5% (USE PERCENTAGE!)
                // Total: 100% - no scrollbar!
                
                show_delete_button: true,
                hide_row_numbers: true,
                hide_checkboxes: true
            });
        }
    }
});

// SOLUTION 2: Reduce data column percentages to account for fixed actions width
// Use this if you need a fixed pixel width for the actions column

frappe.ui.form.on('Your DocType', {
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
                // Reduce percentages to leave room for 120px actions column
                column_widths: {
                    'activity': '36%',              // Reduced from 40%
                    'total_labour_sell': '14%',     // Reduced from 15%
                    'total_purchase_sell': '14%',   // Reduced from 15%
                    'total_margin': '9%',           // Reduced from 10%
                    'total_sell': '14%'             // Reduced from 15%
                    // Subtotal: 87% (leaving ~13% for 120px actions)
                },
                actions_column_width: '120px',      // Fixed width
                
                show_delete_button: true,
                hide_row_numbers: true,
                hide_checkboxes: true
            });
        }
    }
});

// SOLUTION 3: Use pixels for everything (for precise control)

frappe.ui.form.on('Your DocType', {
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
                // Use pixels (assuming ~1000px total width available)
                column_widths: {
                    'activity': '400px',            // 40%
                    'total_labour_sell': '150px',   // 15%
                    'total_purchase_sell': '150px', // 15%
                    'total_margin': '100px',        // 10%
                    'total_sell': '150px'           // 15%
                    // Subtotal: 950px
                },
                actions_column_width: '100px',      // 10%
                // Total: 1050px (adjust if needed)
                
                show_delete_button: true,
                hide_row_numbers: true,
                hide_checkboxes: true
            });
        }
    }
});

/**
 * DEBUGGING TIPS:
 * 
 * 1. If you see a horizontal scrollbar:
 *    - Your column widths add up to MORE than 100%
 *    - Solution: Reduce some column widths
 * 
 * 2. If columns are not aligned:
 *    - Check that you've defined widths for ALL visible columns
 *    - Check that the actions column is included in the total row
 *    - Use browser DevTools to inspect computed widths
 * 
 * 3. To check your math:
 *    - Add up all data column percentages
 *    - Add the actions column percentage
 *    - Total should be ≤ 100%
 * 
 * 4. Quick test:
 *    - Set all columns to equal percentages
 *    - For 5 data + 1 actions = 6 columns
 *    - Each column: 16.67% (100% / 6)
 *    - This should work perfectly
 */

