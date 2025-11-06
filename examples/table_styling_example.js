/**
 * Example: Table Styling Configuration
 * 
 * This shows how to configure the appearance of child tables
 * using Frappe's Client Script feature.
 * 
 * To use:
 * 1. Go to: Setup > Customization > Client Script
 * 2. Create new Client Script
 * 3. Select your DocType (e.g., "Trigger Agent Obsidian Note Manager")
 * 4. Copy the relevant code below
 */

// ============================================
// Example 1: Hide Row Numbers and Checkboxes
// ============================================

frappe.ui.form.on('Trigger Agent Obsidian Note Manager', {
    refresh: function(frm) {
        // Configure the "available_tools" table
        if (frm.fields_dict.available_tools && frm.fields_dict.available_tools.grid) {
            frm.fields_dict.available_tools.grid.configure_enhanced_grid({
                hide_row_numbers: true,      // Hide the "No." column
                hide_checkboxes: true,        // Hide checkboxes
                hide_edit_icon: true,         // Hide the edit/configure icon
                primary_link_field: 'tool',   // Click row to open Tool
                show_row_actions: true        // Show duplicate/insert buttons on hover
            });
        }
    }
});

// ============================================
// Example 2: Minimal Clean Table
// ============================================

frappe.ui.form.on('Your DocType', {
    refresh: function(frm) {
        if (frm.fields_dict.your_table && frm.fields_dict.your_table.grid) {
            frm.fields_dict.your_table.grid.configure_enhanced_grid({
                hide_row_numbers: true,
                hide_checkboxes: true,
                hide_edit_icon: true,
                hide_add_row_button: false,   // Keep add row button
                show_row_actions: false,      // Hide action buttons for cleaner look
                enable_sorting: true,         // Keep sorting
                primary_link_field: 'item_code'
            });
        }
    }
});

// ============================================
// Example 3: Custom CSS Styling
// ============================================

frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                hide_row_numbers: true,
                hide_checkboxes: true,
                custom_css: `
                    /* Make rows taller */
                    .grid-body .data-row {
                        min-height: 50px;
                    }
                    
                    /* Alternate row colors */
                    .grid-body .data-row:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    
                    /* Highlight important rows */
                    .grid-body .data-row[data-idx="1"] {
                        background-color: #fff3cd;
                        font-weight: bold;
                    }
                    
                    /* Custom hover color */
                    .grid-body .data-row:hover {
                        background-color: #e3f2fd !important;
                    }
                    
                    /* Hide specific columns by fieldname */
                    .col[data-fieldname="uom"] {
                        display: none !important;
                    }
                `
            });
        }
    }
});

// ============================================
// Example 4: Different Configs for Multiple Tables
// ============================================

frappe.ui.form.on('BOM', {
    refresh: function(frm) {
        // Items table - minimal and clean
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                hide_row_numbers: true,
                hide_checkboxes: true,
                hide_edit_icon: true,
                primary_link_field: 'item_code',
                enable_sorting: true,
                show_row_actions: true
            });
        }
        
        // Scrap items table - keep checkboxes for bulk delete
        if (frm.fields_dict.scrap_items && frm.fields_dict.scrap_items.grid) {
            frm.fields_dict.scrap_items.grid.configure_enhanced_grid({
                hide_row_numbers: true,
                hide_checkboxes: false,       // Keep checkboxes
                hide_edit_icon: true,
                show_row_actions: false
            });
        }
    }
});

// ============================================
// Example 5: Conditional Styling Based on Values
// ============================================

frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                hide_row_numbers: true,
                hide_checkboxes: true,
                primary_link_field: 'item_code'
            });
            
            // Add custom styling based on row values
            frm.fields_dict.items.grid.grid_rows.forEach(function(row) {
                if (row.doc.qty > 100) {
                    // Highlight high quantity rows
                    row.row.css('background-color', '#d4edda');
                }
                
                if (row.doc.rate < 10) {
                    // Highlight low price rows
                    row.row.css('border-left', '3px solid #f8d7da');
                }
            });
        }
    }
});

// ============================================
// Example 6: Hide Columns Dynamically
// ============================================

frappe.ui.form.on('Purchase Order', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            frm.fields_dict.items.grid.configure_enhanced_grid({
                hide_row_numbers: true,
                hide_checkboxes: true,
                custom_css: `
                    /* Hide columns you don't need */
                    .col[data-fieldname="warehouse"] {
                        display: none !important;
                    }
                    
                    .col[data-fieldname="uom"] {
                        display: none !important;
                    }
                    
                    /* Make important columns wider */
                    .col[data-fieldname="item_code"] {
                        flex: 2 !important;
                    }
                    
                    /* Make description column take remaining space */
                    .col[data-fieldname="description"] {
                        flex: 3 !important;
                    }
                `
            });
        }
    }
});

// ============================================
// Example 7: Read-Only Table (No Add/Edit)
// ============================================

frappe.ui.form.on('Your DocType', {
    refresh: function(frm) {
        if (frm.fields_dict.readonly_table && frm.fields_dict.readonly_table.grid) {
            frm.fields_dict.readonly_table.grid.configure_enhanced_grid({
                hide_row_numbers: true,
                hide_checkboxes: true,
                hide_edit_icon: true,
                hide_add_row_button: true,    // Hide add button
                show_row_actions: false,      // Hide all action buttons
                enable_sorting: true,         // Keep sorting
                primary_link_field: 'reference'
            });
            
            // Hide delete buttons
            frm.fields_dict.readonly_table.grid.wrapper.find('.grid-delete-row').hide();
        }
    }
});

// ============================================
// Example 8: Compact Table for Mobile
// ============================================

frappe.ui.form.on('Your DocType', {
    refresh: function(frm) {
        if (frm.fields_dict.items && frm.fields_dict.items.grid) {
            const is_mobile = window.innerWidth < 768;
            
            frm.fields_dict.items.grid.configure_enhanced_grid({
                hide_row_numbers: is_mobile,
                hide_checkboxes: is_mobile,
                hide_edit_icon: is_mobile,
                show_row_actions: !is_mobile,
                custom_css: is_mobile ? `
                    /* Compact mobile view */
                    .grid-body .data-row {
                        font-size: 12px;
                        padding: 5px;
                    }
                    
                    .col {
                        padding: 5px !important;
                    }
                ` : null
            });
        }
    }
});

// ============================================
// Example 9: Color-Coded Rows by Status
// ============================================

frappe.ui.form.on('Task', {
    refresh: function(frm) {
        if (frm.fields_dict.depends_on && frm.fields_dict.depends_on.grid) {
            frm.fields_dict.depends_on.grid.configure_enhanced_grid({
                hide_row_numbers: true,
                hide_checkboxes: true,
                custom_css: `
                    /* Color code by status */
                    .grid-body .data-row {
                        border-left: 3px solid transparent;
                    }
                    
                    /* You can add data attributes in row rendering */
                    .grid-body .data-row[data-status="Open"] {
                        border-left-color: #ffc107;
                    }
                    
                    .grid-body .data-row[data-status="Completed"] {
                        border-left-color: #28a745;
                        opacity: 0.7;
                    }
                    
                    .grid-body .data-row[data-status="Cancelled"] {
                        border-left-color: #dc3545;
                        text-decoration: line-through;
                    }
                `
            });
        }
    }
});

// ============================================
// Example 10: Complete Custom Styling
// ============================================

frappe.ui.form.on('Trigger Agent Obsidian Note Manager', {
    refresh: function(frm) {
        // Style available_tools table
        if (frm.fields_dict.available_tools && frm.fields_dict.available_tools.grid) {
            frm.fields_dict.available_tools.grid.configure_enhanced_grid({
                hide_row_numbers: true,
                hide_checkboxes: true,
                hide_edit_icon: true,
                primary_link_field: 'tool',
                show_row_actions: true,
                enable_sorting: true,
                custom_css: `
                    /* Modern card-like appearance */
                    .grid-body .data-row {
                        margin-bottom: 8px;
                        border-radius: 4px;
                        border: 1px solid #e0e0e0;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                        transition: all 0.2s;
                    }
                    
                    .grid-body .data-row:hover {
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        transform: translateY(-1px);
                    }
                    
                    /* Hide grid lines */
                    .grid-body .data-row .col {
                        border: none !important;
                    }
                    
                    /* Larger, more readable text */
                    .grid-body .data-row {
                        font-size: 14px;
                        min-height: 45px;
                    }
                `
            });
        }
    }
});

