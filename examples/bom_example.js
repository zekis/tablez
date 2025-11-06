/**
 * Example: BOM (Bill of Materials) Enhanced Grid Configuration
 * 
 * This example shows how to configure the enhanced grid for BOM items
 * with grouping by item group and custom features.
 * 
 * File location: custom_app/public/js/bom.js
 * Then add to hooks.py:
 * doctype_js = {"BOM": "public/js/bom.js"}
 */

frappe.ui.form.on('BOM', {
    refresh: function(frm) {
        // Configure items table with grouping
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                // Click row to open Item document
                primary_link_field: 'item_code',
                
                // Show dialog when adding (useful for complex BOMs)
                show_add_dialog: true,
                
                // Enable sorting
                enable_sorting: true,
                
                // Enable grouping by item group
                enable_grouping: true,
                group_by_field: 'item_group',
                
                // Enhanced link clicks
                enhanced_link_clicks: true,
                
                // Show row actions
                show_row_actions: true
            });
        }

        // Add custom BOM-specific buttons
        add_bom_grid_buttons(frm);
    },

    onload: function(frm) {
        setup_bom_grid_features(frm);
    }
});

/**
 * Add BOM-specific grid buttons
 */
function add_bom_grid_buttons(frm) {
    if (!frm.fields_dict.items || !frm.fields_dict.items.grid) return;

    const grid = frm.fields_dict.items.grid;

    if (grid.grid_buttons && !grid.bom_buttons_added) {
        // Add "Import from Another BOM" button
        $('<button class="btn btn-xs btn-secondary" style="margin-left: 5px;">')
            .html(__('Import from BOM'))
            .prependTo(grid.grid_buttons)
            .on('click', function() {
                import_from_bom(frm);
                return false;
            });

        // Add "Calculate Costs" button
        $('<button class="btn btn-xs btn-primary" style="margin-left: 5px;">')
            .html(__('Calculate Costs'))
            .appendTo(grid.grid_buttons)
            .on('click', function() {
                calculate_all_costs(frm);
                return false;
            });

        // Add "Group by Item Group" toggle
        $('<button class="btn btn-xs btn-secondary" style="margin-left: 5px;">')
            .html(__('Toggle Grouping'))
            .appendTo(grid.grid_buttons)
            .on('click', function() {
                toggle_grouping(frm);
                return false;
            });

        grid.bom_buttons_added = true;
    }
}

/**
 * Setup BOM-specific grid features
 */
function setup_bom_grid_features(frm) {
    // Add visual indicators for item types
    add_item_type_indicators(frm);
    
    // Setup cost calculation on qty change
    setup_auto_cost_calculation(frm);
    
    // Add keyboard shortcuts
    setup_bom_keyboard_shortcuts(frm);
}

/**
 * Add visual indicators for different item types
 */
function add_item_type_indicators(frm) {
    if (!frm.fields_dict.items || !frm.fields_dict.items.grid) return;

    const grid = frm.fields_dict.items.grid;

    // Add CSS classes based on item type
    grid.wrapper.on('grid-row-render', function() {
        grid.grid_rows.forEach(function(row) {
            if (row.doc.item_code) {
                // Fetch item type and add indicator
                frappe.db.get_value('Item', row.doc.item_code, 'item_group', function(r) {
                    if (r && r.item_group) {
                        row.row.attr('data-item-group', r.item_group);
                        
                        // Add colored border based on item group
                        const color = get_item_group_color(r.item_group);
                        row.row.css('border-left', `3px solid ${color}`);
                    }
                });
            }
        });
    });
}

/**
 * Get color for item group
 */
function get_item_group_color(item_group) {
    const colors = {
        'Raw Material': '#ff6b6b',
        'Sub Assembly': '#4ecdc4',
        'Consumable': '#ffe66d',
        'Services': '#95e1d3'
    };
    return colors[item_group] || '#95a5a6';
}

/**
 * Setup automatic cost calculation
 */
function setup_auto_cost_calculation(frm) {
    // Recalculate costs when qty changes
    frm.fields_dict.items.grid.wrapper.on('change', 'input[data-fieldname="qty"]', function() {
        const $row = $(this).closest('.grid-row');
        const row_idx = $row.data('idx');
        
        if (row_idx) {
            const row = frm.fields_dict.items.grid.grid_rows.find(r => r.doc.idx === row_idx);
            if (row && row.doc.item_code) {
                calculate_row_cost(frm, row.doc);
            }
        }
    });
}

/**
 * Calculate cost for a single row
 */
function calculate_row_cost(frm, row_doc) {
    frappe.call({
        method: 'erpnext.manufacturing.doctype.bom.bom.get_bom_item_rate',
        args: {
            item_code: row_doc.item_code,
            qty: row_doc.qty
        },
        callback: function(r) {
            if (r.message) {
                frappe.model.set_value(row_doc.doctype, row_doc.name, 'rate', r.message.rate);
                frappe.model.set_value(row_doc.doctype, row_doc.name, 'amount', 
                    flt(row_doc.qty) * flt(r.message.rate));
            }
        }
    });
}

/**
 * Import items from another BOM
 */
function import_from_bom(frm) {
    const d = new frappe.ui.Dialog({
        title: __('Import from BOM'),
        fields: [
            {
                fieldtype: 'Link',
                fieldname: 'source_bom',
                label: __('Source BOM'),
                options: 'BOM',
                reqd: 1,
                get_query: function() {
                    return {
                        filters: {
                            'name': ['!=', frm.doc.name],
                            'docstatus': 1
                        }
                    };
                }
            },
            {
                fieldtype: 'Check',
                fieldname: 'clear_existing',
                label: __('Clear Existing Items'),
                default: 0
            },
            {
                fieldtype: 'Float',
                fieldname: 'qty_multiplier',
                label: __('Quantity Multiplier'),
                default: 1.0,
                description: __('Multiply all quantities by this factor')
            }
        ],
        primary_action_label: __('Import'),
        primary_action: function(values) {
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'BOM',
                    name: values.source_bom
                },
                callback: function(r) {
                    if (r.message && r.message.items) {
                        // Clear existing if requested
                        if (values.clear_existing) {
                            frm.clear_table('items');
                        }
                        
                        // Add items from source BOM
                        r.message.items.forEach(function(item) {
                            const row = frm.add_child('items');
                            row.item_code = item.item_code;
                            row.item_name = item.item_name;
                            row.qty = flt(item.qty) * flt(values.qty_multiplier);
                            row.rate = item.rate;
                            row.uom = item.uom;
                            row.item_group = item.item_group;
                        });
                        
                        frm.refresh_field('items');
                        
                        frappe.show_alert({
                            message: __('Imported {0} items from {1}', 
                                [r.message.items.length, values.source_bom]),
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
 * Calculate costs for all items
 */
function calculate_all_costs(frm) {
    if (!frm.doc.items || frm.doc.items.length === 0) {
        frappe.msgprint(__('No items to calculate'));
        return;
    }

    frappe.show_alert({
        message: __('Calculating costs...'),
        indicator: 'blue'
    });

    let processed = 0;
    frm.doc.items.forEach(function(item) {
        if (item.item_code) {
            calculate_row_cost(frm, item);
            processed++;
        }
    });

    setTimeout(function() {
        frappe.show_alert({
            message: __('Calculated costs for {0} items', [processed]),
            indicator: 'green'
        });
    }, 1000);
}

/**
 * Toggle grouping on/off
 */
function toggle_grouping(frm) {
    const grid = frm.fields_dict.items.grid;
    const current_config = grid.enhanced_config;
    
    grid.configure_enhanced_grid({
        enable_grouping: !current_config.enable_grouping,
        group_by_field: 'item_group'
    });

    frappe.show_alert({
        message: current_config.enable_grouping ? 
            __('Grouping disabled') : __('Grouping enabled'),
        indicator: 'blue'
    });
}

/**
 * Setup keyboard shortcuts for BOM
 */
function setup_bom_keyboard_shortcuts(frm) {
    $(document).on('keydown', function(e) {
        // Only if BOM form is active
        if (cur_frm && cur_frm.doctype === 'BOM') {
            // Ctrl+Shift+C: Calculate all costs
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                calculate_all_costs(frm);
            }
            
            // Ctrl+Shift+G: Toggle grouping
            if (e.ctrlKey && e.shiftKey && e.key === 'G') {
                e.preventDefault();
                toggle_grouping(frm);
            }
        }
    });
}

/**
 * Child table events
 */
frappe.ui.form.on('BOM Item', {
    item_code: function(frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        
        if (row.item_code) {
            // Fetch item details
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Item',
                    name: row.item_code
                },
                callback: function(r) {
                    if (r.message) {
                        frappe.model.set_value(cdt, cdn, 'item_name', r.message.item_name);
                        frappe.model.set_value(cdt, cdn, 'uom', r.message.stock_uom);
                        frappe.model.set_value(cdt, cdn, 'item_group', r.message.item_group);
                        
                        // Set default qty to 1
                        if (!row.qty) {
                            frappe.model.set_value(cdt, cdn, 'qty', 1);
                        }
                        
                        // Calculate cost
                        calculate_row_cost(frm, row);
                    }
                }
            });
        }
    },

    qty: function(frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        if (row.item_code && row.qty) {
            calculate_row_cost(frm, row);
        }
    }
});

