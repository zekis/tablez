/**
 * Column Width Configuration for Perfect Alignment
 * 
 * This example shows how to fix column alignment issues by defining
 * exact column widths that override Bootstrap's grid system.
 */

// For your Activity Section table
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
                // Define exact column widths
                // IMPORTANT: When using a fixed pixel width for actions column,
                // use percentages that account for it, or use calc()
                // Option 1: Use smaller percentages (recommended)
                column_widths: {
                    'activity': '35%',              // 35% for activity name
                    'total_labour_sell': '14%',     // 14% for labour sell
                    'total_purchase_sell': '14%',   // 14% for purchase sell
                    'total_margin': '9%',           // 9% for margin
                    'total_sell': '14%'             // 14% for total sell
                    // Total: 86%, leaving ~14% for 120px actions + padding
                },
                actions_column_width: '120px',      // Fixed 120px for actions

                // Option 2: Use percentage for actions too (better for responsive)
                // column_widths: {
                //     'activity': '40%',
                //     'total_labour_sell': '15%',
                //     'total_purchase_sell': '15%',
                //     'total_margin': '10%',
                //     'total_sell': '15%'
                // },
                // actions_column_width: '5%',  // Use percentage instead
                show_delete_button: true,
                hide_row_numbers: true,             // Hide row numbers
                hide_checkboxes: true               // Hide checkboxes
            });
        }
    }
});

/**
 * How to calculate column widths:
 *
 * IMPORTANT: Avoid horizontal scrollbar by ensuring total width ≤ 100%
 *
 * Method 1: Use percentages for ALL columns (RECOMMENDED)
 * --------------------------------------------------------
 * 1. Count your visible columns (including actions)
 * 2. Divide 100% among all columns
 * 3. Example for 5 data + 1 actions = 6 columns:
 *    - Data columns: 40% + 15% + 15% + 10% + 15% = 95%
 *    - Actions: 5%
 *    - Total: 100%
 *
 * column_widths: {
 *     'activity': '40%',
 *     'total_labour_sell': '15%',
 *     'total_purchase_sell': '15%',
 *     'total_margin': '10%',
 *     'total_sell': '15%'
 * },
 * actions_column_width: '5%'  // Use percentage!
 *
 * Method 2: Use pixels for actions, reduce data column percentages
 * -----------------------------------------------------------------
 * 1. Decide actions width in pixels (e.g., 120px)
 * 2. Estimate what % that represents (~10-15% typically)
 * 3. Use remaining % for data columns (85-90%)
 * 4. Example:
 *    - Actions: 120px (~12% of typical 1000px width)
 *    - Data columns: 35% + 14% + 14% + 9% + 14% = 86%
 *    - Total: ~98%
 *
 * column_widths: {
 *     'activity': '35%',
 *     'total_labour_sell': '14%',
 *     'total_purchase_sell': '14%',
 *     'total_margin': '9%',
 *     'total_sell': '14%'
 * },
 * actions_column_width: '120px'
 *
 * Method 3: Use pixels for ALL columns
 * -------------------------------------
 * 1. Estimate total available width (e.g., 1000px)
 * 2. Distribute among all columns
 * 3. Example:
 *    - activity: 350px
 *    - total_labour_sell: 150px
 *    - total_purchase_sell: 150px
 *    - total_margin: 100px
 *    - total_sell: 150px
 *    - actions: 100px
 *    - Total: 1000px
 *
 * column_widths: {
 *     'activity': '350px',
 *     'total_labour_sell': '150px',
 *     ...
 * },
 * actions_column_width: '100px'
 */

