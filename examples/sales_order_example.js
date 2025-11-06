/**
 * Example: Sales Order Enhanced Grid Configuration
 * 
 * This file shows how to configure the enhanced grid for Sales Order items table.
 * Copy this to your custom app's public/js folder and modify as needed.
 * 
 * File location: custom_app/public/js/sales_order.js
 * Then add to hooks.py:
 * doctype_js = {"Sales Order": "public/js/sales_order.js"}
 */

frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
        // Configure items table
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                // Click row to open Item document
                primary_link_field: 'item_code',
                
                // Show dialog when adding new rows
                show_add_dialog: true,
                
                // Enable column sorting
                enable_sorting: true,
                
                // Disable grouping (can be slow with many items)
                enable_grouping: false,
                
                // Make link fields more clickable
                enhanced_link_clicks: true,
                
                // Show quick action buttons on hover
                show_row_actions: true,
                
                // Allow drag-and-drop reordering
                allow_row_reorder: true
            });
        }

        // Configure taxes table (keep default behavior)
        if (frm.fields_dict.taxes && frm.fields_dict.taxes.grid) {
            // Disable enhanced grid for taxes table
            frm.fields_dict.taxes.grid.disable_enhanced_grid();
        }

        // Add custom button to items grid
        add_custom_grid_buttons(frm);
    },

    onload: function(frm) {
        // Set up event handlers
        setup_item_grid_events(frm);
    }
});

/**
 * Add custom buttons to items grid toolbar
 */
function add_custom_grid_buttons(frm) {
    if (!frm.fields_dict.items || !frm.fields_dict.items.grid) return;

    const grid = frm.fields_dict.items.grid;

    // Add "Import from Template" button
    if (grid.grid_buttons && !grid.custom_buttons_added) {
        $('<button class="btn btn-xs btn-secondary" style="margin-left: 5px;">')
            .html(__('Import from Template'))
            .prependTo(grid.grid_buttons)
            .on('click', function() {
                import_from_template(frm);
                return false;
            });

        // Add "Clear All Items" button
        $('<button class="btn btn-xs btn-danger" style="margin-left: 5px;">')
            .html(__('Clear All'))
            .appendTo(grid.grid_buttons)
            .on('click', function() {
                clear_all_items(frm);
                return false;
            });

        grid.custom_buttons_added = true;
    }
}

/**
 * Set up custom event handlers for items grid
 */
function setup_item_grid_events(frm) {
    // Example: Auto-calculate total when qty or rate changes
    frm.fields_dict.items.grid.wrapper.on('change', 'input[data-fieldname="qty"], input[data-fieldname="rate"]', function() {
        const $row = $(this).closest('.grid-row');
        const row_idx = $row.data('idx');
        
        if (row_idx) {
            const row = frm.fields_dict.items.grid.grid_rows.find(r => r.doc.idx === row_idx);
            if (row) {
                // Trigger calculation
                frappe.model.set_value(row.doc.doctype, row.doc.name, 'amount', 
                    flt(row.doc.qty) * flt(row.doc.rate));
            }
        }
    });
}

/**
 * Import items from a template
 */
function import_from_template(frm) {
    // Show dialog to select template
    const d = new frappe.ui.Dialog({
        title: __('Import from Template'),
        fields: [
            {
                fieldtype: 'Link',
                fieldname: 'template',
                label: __('Select Template'),
                options: 'Item Template',  // Replace with your template doctype
                reqd: 1
            }
        ],
        primary_action_label: __('Import'),
        primary_action: function(values) {
            // Fetch template items
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Item Template',
                    name: values.template
                },
                callback: function(r) {
                    if (r.message && r.message.items) {
                        // Clear existing items
                        frm.clear_table('items');
                        
                        // Add template items
                        r.message.items.forEach(function(item) {
                            const row = frm.add_child('items');
                            row.item_code = item.item_code;
                            row.qty = item.qty;
                            row.rate = item.rate;
                        });
                        
                        frm.refresh_field('items');
                        frappe.show_alert({
                            message: __('Items imported successfully'),
                            indicator: 'green'
                        });
                    }
                }
            });
            d.hide();
        }
    });
    d.show();
}

/**
 * Clear all items with confirmation
 */
function clear_all_items(frm) {
    frappe.confirm(
        __('Are you sure you want to clear all items?'),
        function() {
            frm.clear_table('items');
            frm.refresh_field('items');
            frappe.show_alert({
                message: __('All items cleared'),
                indicator: 'orange'
            });
        }
    );
}

/**
 * Child table events
 */
frappe.ui.form.on('Sales Order Item', {
    item_code: function(frm, cdt, cdn) {
        // Auto-fetch item details when item is selected
        const row = locals[cdt][cdn];
        
        if (row.item_code) {
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Item',
                    name: row.item_code
                },
                callback: function(r) {
                    if (r.message) {
                        frappe.model.set_value(cdt, cdn, 'item_name', r.message.item_name);
                        frappe.model.set_value(cdt, cdn, 'description', r.message.description);
                        frappe.model.set_value(cdt, cdn, 'rate', r.message.standard_rate);
                    }
                }
            });
        }
    },

    qty: function(frm, cdt, cdn) {
        // Calculate amount when qty changes
        calculate_amount(frm, cdt, cdn);
    },

    rate: function(frm, cdt, cdn) {
        // Calculate amount when rate changes
        calculate_amount(frm, cdt, cdn);
    }
});

/**
 * Calculate row amount
 */
function calculate_amount(frm, cdt, cdn) {
    const row = locals[cdt][cdn];
    const amount = flt(row.qty) * flt(row.rate);
    frappe.model.set_value(cdt, cdn, 'amount', amount);
}

/**
 * Advanced: Custom sorting logic
 */
function setup_custom_sorting(frm) {
    const grid = frm.fields_dict.items.grid;
    
    // Override sort method for custom logic
    grid.sort_by_field_custom = function(fieldname, order) {
        const data = this.get_data();
        
        // Custom sorting logic
        data.sort((a, b) => {
            // Example: Sort items by item_group first, then by item_code
            if (a.item_group !== b.item_group) {
                return a.item_group < b.item_group ? -1 : 1;
            }
            
            // Then by the selected field
            let val_a = a[fieldname];
            let val_b = b[fieldname];
            
            if (val_a < val_b) return order === 'asc' ? -1 : 1;
            if (val_a > val_b) return order === 'asc' ? 1 : -1;
            return 0;
        });
        
        this.refresh();
    };
}

/**
 * Advanced: Add row validation
 */
function setup_row_validation(frm) {
    // Validate before adding row
    frm.fields_dict.items.grid.add_new_row_original = frm.fields_dict.items.grid.add_new_row;
    
    frm.fields_dict.items.grid.add_new_row = function(idx) {
        // Check if customer is selected
        if (!frm.doc.customer) {
            frappe.msgprint(__('Please select a customer first'));
            return;
        }
        
        // Check if there are already too many items
        if (frm.doc.items && frm.doc.items.length >= 100) {
            frappe.msgprint(__('Maximum 100 items allowed'));
            return;
        }
        
        // Call original method
        return this.add_new_row_original(idx);
    };
}

/**
 * Advanced: Export selected items
 */
function export_selected_items(frm) {
    const selected = tablez.get_selected_rows(frm.fields_dict.items.grid);
    
    if (selected.length === 0) {
        frappe.msgprint(__('Please select items to export'));
        return;
    }
    
    // Export to CSV
    tablez.export_to_csv(selected, 'sales_order_items.csv');
}

