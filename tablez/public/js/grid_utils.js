/**
 * Grid Utilities
 * Helper functions for enhanced grid functionality
 */

(function() {
    'use strict';

    // Create namespace
    window.tablez = window.tablez || {};

    /**
     * Detect if device is mobile
     */
    tablez.is_mobile = function() {
        return window.innerWidth < 768;
    };

    /**
     * Get primary link field from child doctype
     */
    tablez.get_primary_link_field = function(doctype) {
        const meta = frappe.get_meta(doctype);
        if (!meta || !meta.fields) return null;

        // Find first Link field
        const link_field = meta.fields.find(f => f.fieldtype === 'Link');
        return link_field ? link_field.fieldname : null;
    };

    /**
     * Get all link fields from child doctype
     */
    tablez.get_link_fields = function(doctype) {
        const meta = frappe.get_meta(doctype);
        if (!meta || !meta.fields) return [];

        return meta.fields.filter(f => f.fieldtype === 'Link');
    };

    /**
     * Open document in new tab or same tab
     */
    tablez.open_doc = function(doctype, docname, new_tab) {
        if (!doctype || !docname) return;

        const route = `/app/${frappe.router.slug(doctype)}/${docname}`;
        
        if (new_tab) {
            window.open(route, '_blank');
        } else {
            frappe.set_route('Form', doctype, docname);
        }
    };

    /**
     * Show temporary alert
     */
    tablez.show_alert = function(message, indicator) {
        frappe.show_alert({
            message: message,
            indicator: indicator || 'green'
        }, 3);
    };

    /**
     * Debounce function for performance
     */
    tablez.debounce = function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    /**
     * Get field value safely
     */
    tablez.get_field_value = function(doc, fieldname) {
        return doc && doc[fieldname] ? doc[fieldname] : null;
    };

    /**
     * Check if field is visible
     */
    tablez.is_field_visible = function(df) {
        return df && !df.hidden && !df.read_only;
    };

    /**
     * Get visible fields from doctype
     */
    tablez.get_visible_fields = function(doctype) {
        const meta = frappe.get_meta(doctype);
        if (!meta || !meta.fields) return [];

        return meta.fields.filter(f => 
            !f.hidden && 
            !f.read_only && 
            f.fieldtype !== 'Table' &&
            f.fieldtype !== 'Section Break' &&
            f.fieldtype !== 'Column Break'
        );
    };

    /**
     * Sort array of objects by field
     */
    tablez.sort_by_field = function(data, fieldname, order) {
        return data.sort((a, b) => {
            let val_a = a[fieldname];
            let val_b = b[fieldname];

            // Handle null/undefined
            if (val_a == null) return 1;
            if (val_b == null) return -1;

            // Handle numbers
            if (typeof val_a === 'number' && typeof val_b === 'number') {
                return order === 'asc' ? val_a - val_b : val_b - val_a;
            }

            // Handle strings
            val_a = String(val_a).toLowerCase();
            val_b = String(val_b).toLowerCase();

            if (val_a < val_b) return order === 'asc' ? -1 : 1;
            if (val_a > val_b) return order === 'asc' ? 1 : -1;
            return 0;
        });
    };

    /**
     * Group array of objects by field
     */
    tablez.group_by_field = function(data, fieldname) {
        const groups = {};
        
        data.forEach(item => {
            const group_value = item[fieldname] || __('Ungrouped');
            if (!groups[group_value]) {
                groups[group_value] = [];
            }
            groups[group_value].push(item);
        });

        return groups;
    };

    /**
     * Export data to CSV
     */
    tablez.export_to_csv = function(data, filename) {
        if (!data || data.length === 0) {
            frappe.msgprint(__('No data to export'));
            return;
        }

        // Get headers
        const headers = Object.keys(data[0]);
        
        // Create CSV content
        let csv = headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                // Escape commas and quotes
                if (value && typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return '"' + value.replace(/"/g, '""') + '"';
                }
                return value || '';
            });
            csv += values.join(',') + '\n';
        });

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'export.csv';
        a.click();
        window.URL.revokeObjectURL(url);

        tablez.show_alert(__('Exported {0} rows', [data.length]));
    };

    /**
     * Copy row data
     */
    tablez.copy_row = function(doc, exclude_fields) {
        const copy = {};
        exclude_fields = exclude_fields || ['name', 'idx', 'creation', 'modified', 'modified_by', 'owner'];

        Object.keys(doc).forEach(key => {
            if (!exclude_fields.includes(key)) {
                copy[key] = doc[key];
            }
        });

        return copy;
    };

    /**
     * Validate required fields
     */
    tablez.validate_required_fields = function(doc, meta) {
        const missing = [];

        meta.fields.forEach(field => {
            if (field.reqd && !doc[field.fieldname]) {
                missing.push(field.label || field.fieldname);
            }
        });

        return missing;
    };

    /**
     * Format value for display
     */
    tablez.format_value = function(value, fieldtype) {
        if (value == null) return '';

        switch (fieldtype) {
            case 'Currency':
                return format_currency(value);
            case 'Float':
                return flt(value, 2);
            case 'Int':
                return cint(value);
            case 'Date':
                return frappe.datetime.str_to_user(value);
            case 'Datetime':
                return frappe.datetime.str_to_user(value);
            case 'Check':
                return value ? '✓' : '';
            default:
                return value;
        }
    };

    /**
     * Get field display value
     */
    tablez.get_display_value = function(doc, fieldname, meta) {
        const field = meta.fields.find(f => f.fieldname === fieldname);
        if (!field) return doc[fieldname];

        const value = doc[fieldname];
        return tablez.format_value(value, field.fieldtype);
    };

    /**
     * Check if grid has unsaved changes
     */
    tablez.has_unsaved_changes = function(frm) {
        return frm && frm.is_dirty && frm.is_dirty();
    };

    /**
     * Prompt to save before action
     */
    tablez.prompt_save = function(frm, callback) {
        if (tablez.has_unsaved_changes(frm)) {
            frappe.confirm(
                __('You have unsaved changes. Save now?'),
                function() {
                    frm.save().then(callback);
                },
                function() {
                    callback();
                }
            );
        } else {
            callback();
        }
    };

    /**
     * Get grid configuration from field
     */
    tablez.get_grid_config = function(grid) {
        return grid && grid.enhanced_config ? grid.enhanced_config : null;
    };

    /**
     * Set grid configuration
     */
    tablez.set_grid_config = function(grid, config) {
        if (grid && grid.configure_enhanced_grid) {
            grid.configure_enhanced_grid(config);
        }
    };

    /**
     * Log debug message
     */
    tablez.debug = function(message, data) {
        if (frappe.boot.developer_mode) {
            console.log('[Tablez]', message, data || '');
        }
    };

    /**
     * Get row by name
     */
    tablez.get_row_by_name = function(grid, name) {
        if (!grid || !grid.grid_rows) return null;
        return grid.grid_rows.find(row => row.doc.name === name);
    };

    /**
     * Scroll to row
     */
    tablez.scroll_to_row = function(grid_row) {
        if (grid_row && grid_row.row) {
            grid_row.row[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    /**
     * Highlight row temporarily
     */
    tablez.highlight_row = function(grid_row, duration) {
        if (!grid_row || !grid_row.row) return;

        duration = duration || 2000;
        grid_row.row.addClass('just-added');
        
        setTimeout(function() {
            grid_row.row.removeClass('just-added');
        }, duration);
    };

    /**
     * Get selected rows (if checkboxes are implemented)
     */
    tablez.get_selected_rows = function(grid) {
        const selected = [];
        
        if (grid && grid.wrapper) {
            grid.wrapper.find('.grid-row-check input:checked').each(function() {
                const $row = $(this).closest('.grid-row');
                const idx = $row.data('idx');
                if (idx) {
                    const row = grid.grid_rows.find(r => r.doc.idx === idx);
                    if (row) {
                        selected.push(row.doc);
                    }
                }
            });
        }

        return selected;
    };

    /**
     * Initialize enhanced grid for all tables in form
     */
    tablez.init_all_grids = function(frm, config) {
        if (!frm || !frm.fields_dict) return;

        Object.keys(frm.fields_dict).forEach(fieldname => {
            const field = frm.fields_dict[fieldname];
            if (field.df.fieldtype === 'Table' && field.grid) {
                tablez.set_grid_config(field.grid, config);
            }
        });
    };

    /**
     * Configure grid when ready (waits for enhancement to load)
     */
    tablez.configure_grid = function(grid, config, max_retries) {
        max_retries = max_retries || 10;

        if (grid.configure_enhanced_grid) {
            grid.configure_enhanced_grid(config);
        } else if (max_retries > 0) {
            // Grid not enhanced yet, retry
            setTimeout(function() {
                tablez.configure_grid(grid, config, max_retries - 1);
            }, 100);
        } else {
            console.warn('Enhanced grid not available after retries');
        }
    };

    // Log that utilities are loaded
    tablez.debug('Grid utilities loaded');

})();

