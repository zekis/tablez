/**
 * Enhanced Grid - Custom child table implementation for Frappe
 * Replaces default Grid behavior with improved UX
 */

(function() {
    'use strict';

    // Wait for first form with table to load, then get Grid class from instance
    let initialized = false;

    $(document).on('form-load', function() {
        if (initialized) return;

        // Wait a bit for form to fully render
        setTimeout(function() {
            if (!cur_frm || !cur_frm.fields_dict) return;

            // Find a table field
            const tableField = Object.values(cur_frm.fields_dict).find(f => f.df.fieldtype === 'Table');
            if (!tableField || !tableField.grid) return;

            // Get the Grid class from the instance
            const GridClass = tableField.grid.constructor;
            if (!GridClass || GridClass.prototype._enhanced_grid_initialized) return;

            initialized = true;
            initEnhancedGrid(GridClass);

            // Also enhance the current form's grids after a delay (wait for GridRow to load)
            setTimeout(function() {
                enhanceExistingGrids();
            }, 500);
        }, 100);
    });

    function initEnhancedGrid(GridClass) {
        console.log('Initializing Enhanced Grid...');

        // Enhanced Grid Configuration
        const DEFAULT_CONFIG = {
            enabled: false,  // DISABLED by default - only enable via Client Script
            primary_link_field: null,  // Auto-detect if null
            show_add_dialog: false,
            show_add_button: false,  // Show custom Add button above table
            enable_sorting: false,
            enable_grouping: false,
            group_by_field: null,
            show_edit_button: false,  // Show Edit button in Actions column
            show_delete_button: false,  // Show Delete button in Actions column
            show_row_actions: false,
            allow_row_reorder: true,
            enable_row_click: false,
            // Style options
            hide_row_numbers: false,
            hide_checkboxes: false,
            hide_edit_icon: false,
            hide_add_row_button: false,
            hide_bulk_actions: false,
            custom_css: null
        };

        // Store original make method
        const original_make = GridClass.prototype.make;
        const original_refresh = GridClass.prototype.refresh;

        // Override make method
        GridClass.prototype.make = function() {
            // Call original
            original_make.call(this);

            // Initialize enhanced config
            if (!this.enhanced_config) {
                this.enhanced_config = Object.assign({}, DEFAULT_CONFIG);
            }

            // Setup enhanced features
            if (this.enhanced_config.enabled) {
                this.setup_enhanced_features();
            }
        };

        // Override refresh to reapply styles
        GridClass.prototype.refresh = function() {
            // Call original
            original_refresh.call(this);

            // Reapply style config after refresh (but not for edit column if using enhanced links)
            if (this.enhanced_config && this.enhanced_config.enabled) {
                // Don't apply style config immediately if enhanced_link_clicks is enabled
                // because we need the last column for Edit buttons
                if (!this.enhanced_config.enhanced_link_clicks) {
                    this.apply_style_config();
                } else {
                    // Apply other styles but skip the edit column hiding
                    this.apply_style_config_partial();
                }
            }
        };

        /**
         * Setup enhanced features
         */
        GridClass.prototype.setup_enhanced_features = function() {
        this.setup_enhanced_toolbar();
        this.setup_sorting();
        if (this.enhanced_config.enable_grouping) {
            this.setup_grouping();
        }
        this.setup_add_button();
        this.detect_primary_link_field();
        this.apply_style_config();
    };

    /**
     * Detect the primary link field to open when row is clicked
     */
    GridClass.prototype.detect_primary_link_field = function() {
        if (this.enhanced_config.primary_link_field) {
            return;
        }

        // Auto-detect: find first Link field in the child doctype
        const meta = frappe.get_meta(this.doctype);
        if (meta && meta.fields) {
            const link_field = meta.fields.find(f => f.fieldtype === 'Link');
            if (link_field) {
                this.enhanced_config.primary_link_field = link_field.fieldname;
            }
        }
    };

    /**
     * Enhanced toolbar with additional actions
     */
    GridClass.prototype.setup_enhanced_toolbar = function() {
        const me = this;
        
        // Add custom buttons to grid toolbar
        if (this.grid_buttons) {
            // Add "Add with Dialog" button if configured
            if (this.enhanced_config.show_add_dialog) {
                this.grid_buttons.find('.grid-add-row').hide();
                
                $('<button class="btn btn-xs btn-secondary grid-add-row-dialog">')
                    .html(__('Add Row'))
                    .prependTo(this.grid_buttons)
                    .on('click', function() {
                        me.add_row_with_dialog();
                        return false;
                    });
            }

            // Add bulk actions button
            $('<button class="btn btn-xs btn-secondary grid-bulk-actions" style="margin-left: 5px;">')
                .html(__('Bulk Actions'))
                .appendTo(this.grid_buttons)
                .on('click', function() {
                    me.show_bulk_actions_menu();
                    return false;
                });
        }
    };

    /**
     * Add row with dialog for pre-filling values
     */
    GridClass.prototype.add_row_with_dialog = function() {
        const me = this;
        const meta = frappe.get_meta(this.doctype);
        
        // Create dialog with fields from child doctype
        const fields = meta.fields
            .filter(f => !f.hidden && !f.read_only && f.fieldtype !== 'Table')
            .map(f => ({
                fieldtype: f.fieldtype,
                fieldname: f.fieldname,
                label: f.label,
                options: f.options,
                reqd: f.reqd
            }));

        const dialog = new frappe.ui.Dialog({
            title: __('Add {0}', [this.df.label || this.doctype]),
            fields: fields,
            primary_action_label: __('Add'),
            primary_action: function(values) {
                const row = me.add_new_row();
                Object.keys(values).forEach(key => {
                    if (values[key]) {
                        frappe.model.set_value(row.doctype, row.name, key, values[key]);
                    }
                });
                me.refresh();
                dialog.hide();
            }
        });

        dialog.show();
    };

    /**
     * Setup column sorting
     */
    GridClass.prototype.setup_sorting = function() {
        if (!this.enhanced_config.enable_sorting) return;

        const me = this;

        // Add click handlers to column headers with data-fieldname
        this.wrapper.on('click', '.grid-heading-row .col[data-fieldname]', function(e) {
            const $col = $(this);
            const fieldname = $col.attr('data-fieldname');

            if (!fieldname) return;

            // Determine sort order
            const current_sort = $col.attr('data-sort-order') || 'none';
            let new_sort = 'asc';
            
            if (current_sort === 'asc') {
                new_sort = 'desc';
            } else if (current_sort === 'desc') {
                new_sort = 'none';
            }

            // Clear other column sorts (unless shift key for multi-sort)
            if (!e.shiftKey) {
                me.wrapper.find('.grid-heading-row .col').attr('data-sort-order', 'none')
                    .find('.sort-indicator').remove();
            }

            // Apply sort
            if (new_sort === 'none') {
                $col.attr('data-sort-order', 'none');
                $col.find('.sort-indicator').remove();
                me.reset_grid();
            } else {
                $col.attr('data-sort-order', new_sort);
                $col.find('.sort-indicator').remove();
                $col.append(`<span class="sort-indicator">${new_sort === 'asc' ? '▲' : '▼'}</span>`);
                me.sort_by_field(fieldname, new_sort);
            }
        });

        // Add hover effect to indicate sortable columns (only those with fieldnames)
        this.wrapper.find('.grid-heading-row .col[data-fieldname]').css('cursor', 'pointer');
    };

    /**
     * Sort grid by field
     */
    GridClass.prototype.sort_by_field = function(fieldname, order) {
        const data = this.get_data();
        
        data.sort((a, b) => {
            let val_a = a[fieldname];
            let val_b = b[fieldname];

            // Handle null/undefined
            if (val_a == null) return 1;
            if (val_b == null) return -1;

            // Compare
            if (val_a < val_b) return order === 'asc' ? -1 : 1;
            if (val_a > val_b) return order === 'asc' ? 1 : -1;
            return 0;
        });

        this.refresh();
    };

    /**
     * Setup custom Add button in a dummy row
     */
    GridClass.prototype.setup_add_button = function() {
        if (!this.enhanced_config.show_add_button) return;

        const me = this;

        // Remove existing dummy row if present
        this.wrapper.find('.tablez-add-row-dummy').remove();

        // Create a dummy row with Add button in Actions column
        const $dummyRow = $(`
            <div class="data-row row tablez-add-row-dummy"
                 style="border-top: 1px solid var(--border-color, #d1d8dd);">
            </div>
        `);

        // Get all columns from an actual data row, but only add visible ones
        const $firstDataRow = this.wrapper.find('.grid-body .data-row:not(.tablez-add-row-dummy)').first();
        const $allCols = $firstDataRow.find('.col');

        // Add only visible columns (skip hidden and last column)
        $allCols.each(function(index, col) {
            const $col = $(col);
            const isVisible = $col.is(':visible');
            const isLast = index === $allCols.length - 1;

            if (isLast) {
                // Skip - we'll add the Actions column separately
                return;
            }

            if (!isVisible) {
                // Skip hidden columns entirely
                return;
            }

            // Clone the column structure but make it empty
            const colClass = $col.attr('class');
            $dummyRow.append(`<div class="${colClass}" style="padding: 8px;"></div>`);
        });

        // Add the Actions column with Add button
        const $actionsCol = $('<div class="col" style="display: flex; gap: 4px; align-items: center; justify-content: center; padding: 8px;"></div>');

        const $addBtn = $(`
            <button class="btn btn-xs btn-success" style="margin: 4px 0;">
                <svg class="icon icon-xs"><use href="#icon-add"></use></svg>
                Add
            </button>
        `);

        $addBtn.on('click', function() {
            me.show_add_dialog();
        });

        $actionsCol.append($addBtn);
        $dummyRow.append($actionsCol);

        // Insert after the last data row in grid-body
        this.wrapper.find('.grid-body').append($dummyRow);
    };

    /**
     * Show dialog to add new row
     */
    GridClass.prototype.show_add_dialog = function() {
        const me = this;

        // Get all fields from the child table
        const meta = frappe.get_meta(this.doctype);

        if (!meta || !meta.fields) {
            frappe.msgprint('Could not load child table fields');
            return;
        }

        // Build dialog fields from child table fields
        const dialog_fields = [];

        meta.fields.forEach(function(field) {
            // Skip internal fields
            if (field.fieldname === 'name' || field.fieldname === 'idx' ||
                field.fieldname === 'parent' || field.fieldname === 'parenttype' ||
                field.fieldname === 'parentfield' || field.fieldname === 'docstatus') {
                return;
            }

            // Add field to dialog
            dialog_fields.push({
                fieldtype: field.fieldtype,
                fieldname: field.fieldname,
                label: field.label,
                options: field.options,
                reqd: field.reqd,
                default: field.default,
                description: field.description,
                read_only: field.read_only
            });
        });

        // Show dialog
        const d = new frappe.ui.Dialog({
            title: `Add ${this.df.label || 'Row'}`,
            fields: dialog_fields,
            primary_action_label: 'Add',
            primary_action: function(values) {
                // Add new row
                const new_row = me.add_new_row();

                // Set all field values from the dialog
                Object.keys(values).forEach(function(fieldname) {
                    if (values[fieldname] !== undefined && values[fieldname] !== null) {
                        new_row[fieldname] = values[fieldname];
                    }
                });

                // Refresh the grid
                me.refresh();

                // Re-enhance ALL rows after refresh to pick up the new values
                setTimeout(function() {
                    me.grid_rows.forEach(function(grid_row) {
                        if (grid_row.doc && grid_row.setup_enhanced_row_features) {
                            grid_row.setup_enhanced_row_features(true);  // Force refresh
                        }
                    });
                }, 200);

                d.hide();
            }
        });

        d.show();
    };

    /**
     * Setup grouping functionality
     */
    GridClass.prototype.setup_grouping = function() {
        const me = this;
        const group_field = this.enhanced_config.group_by_field;
        
        if (!group_field) return;

        // Group data and render
        this.render_grouped_grid(group_field);
    };

    /**
     * Render grid with grouping
     */
    GridClass.prototype.render_grouped_grid = function(group_field) {
        const data = this.get_data();
        const groups = {};

        // Group data
        data.forEach(row => {
            const group_value = row[group_field] || __('Ungrouped');
            if (!groups[group_value]) {
                groups[group_value] = [];
            }
            groups[group_value].push(row);
        });

        // Render groups
        console.log('Grouped data:', groups);
    };

    /**
     * Show bulk actions menu
     */
    GridClass.prototype.show_bulk_actions_menu = function() {
        frappe.msgprint(__('Bulk actions feature coming soon'));
    };

    /**
     * Apply style configuration (partial - skip edit column)
     */
    GridClass.prototype.apply_style_config_partial = function() {
        const config = this.enhanced_config;

        // Hide row numbers (both header and data rows)
        if (config.hide_row_numbers) {
            this.wrapper.find('.row-index').hide();
            this.wrapper.find('.grid-heading-row .row-index').hide();
        }

        // Hide checkboxes (both header and data rows)
        if (config.hide_checkboxes) {
            this.wrapper.find('.row-check').hide();
            this.wrapper.find('.grid-row-check').hide();
            this.wrapper.find('.grid-heading-row .row-check').hide();
        }

        // Skip hide_edit_icon - we need that column for Edit buttons

        // Hide add row button
        if (config.hide_add_row_button) {
            this.wrapper.find('.grid-add-row').hide();
            this.wrapper.find('.grid-add-row-dialog').hide();
        }

        // Hide row actions if disabled
        if (!config.show_row_actions) {
            this.wrapper.find('.grid-row-actions').hide();
        }

        // Apply custom CSS
        if (config.custom_css) {
            if (!this.wrapper.find('.tablez-custom-style').length) {
                this.wrapper.append(`<style class="tablez-custom-style">${config.custom_css}</style>`);
            }
        }
    };

    /**
     * Apply style configuration (full)
     */
    GridClass.prototype.apply_style_config = function() {
        const config = this.enhanced_config;

        // Hide row numbers (both header and data rows)
        if (config.hide_row_numbers) {
            this.wrapper.find('.row-index').hide();
            this.wrapper.find('.grid-heading-row .row-index').hide();
        }

        // Hide checkboxes (both header and data rows)
        if (config.hide_checkboxes) {
            this.wrapper.find('.row-check').hide();
            this.wrapper.find('.grid-row-check').hide();
            this.wrapper.find('.grid-heading-row .row-check').hide();
        }

        // Hide edit icon (column configure button)
        if (config.show_edit_button || config.show_delete_button) {
            // Keep the column but hide the default icons - we'll add Edit/Delete buttons
            this.wrapper.find('.grid-heading-row .data-row .col:last-child a').hide();
            this.wrapper.find('.grid-body .data-row .col:last-child .btn-open-row').hide();

            // Hide the default link field buttons (arrow and clear) with CSS
            if (!this.wrapper.find('.tablez-hide-link-buttons').length) {
                this.wrapper.append(`
                    <style class="tablez-hide-link-buttons">
                        .grid-body .link-btn {
                            display: none !important;
                        }
                    </style>
                `);
            }
        } else if (config.hide_edit_icon) {
            // Remove the column completely if not using it for Edit buttons
            this.wrapper.find('.grid-heading-row .data-row .col:last-child').remove();
            this.wrapper.find('.grid-body .data-row .col:last-child').remove();
        }

        // Hide add row button
        if (config.hide_add_row_button) {
            this.wrapper.find('.grid-add-row').hide();
            this.wrapper.find('.grid-add-row-dialog').hide();
        }

        // Hide row actions if disabled
        if (!config.show_row_actions) {
            this.wrapper.find('.grid-row-actions').hide();
        }

        // Hide bulk actions if disabled
        if (config.hide_bulk_actions) {
            this.wrapper.find('.grid-bulk-actions').hide();
            this.wrapper.find('.grid-footer-toolbar .btn-group').hide();
        }

        // Reset row cursor if row click is disabled
        if (!config.enable_row_click) {
            this.wrapper.find('.data-row').css('cursor', '');
        }

        // Apply custom CSS
        if (config.custom_css) {
            if (!this.wrapper.find('.tablez-custom-style').length) {
                this.wrapper.append(`<style class="tablez-custom-style">${config.custom_css}</style>`);
            }
        }
    };

    /**
     * Configure enhanced grid
     */
    GridClass.prototype.configure_enhanced_grid = function(config) {
        this.enhanced_config = Object.assign(this.enhanced_config || {}, config);
        this.enhanced_config._user_configured = true;  // Mark as user-configured
        this.setup_enhanced_features();
        this.refresh();

        // Enhance existing rows after refresh
        const me = this;
        setTimeout(function() {
            if (me.grid_rows) {
                me.grid_rows.forEach(row => {
                    if (row.setup_enhanced_row_features && row.doc) {
                        row.setup_enhanced_row_features();
                    }
                });
            }
        }, 100);
    };

    /**
     * Disable enhanced grid
     */
    GridClass.prototype.disable_enhanced_grid = function() {
        this.enhanced_config.enabled = false;
        this.refresh();
    };

        // Mark as initialized
        GridClass.prototype._enhanced_grid_initialized = true;

        console.log('Enhanced Grid loaded successfully');
    }

    // Enhance existing grids on the current form
    function enhanceExistingGrids() {
        if (!cur_frm || !cur_frm.fields_dict) return;

        Object.values(cur_frm.fields_dict).forEach(field => {
            if (field.df.fieldtype === 'Table' && field.grid) {
                const grid = field.grid;

                // Skip if already configured (by Client Script)
                if (grid.enhanced_config && grid.enhanced_config._user_configured) {
                    return;
                }

                // Initialize enhanced config if not present
                if (!grid.enhanced_config) {
                    grid.enhanced_config = {
                        enabled: true,
                        primary_link_field: null,
                        show_add_dialog: false,
                        enable_sorting: true,
                        enable_grouping: false,
                        group_by_field: null,
                        enhanced_link_clicks: false,  // Default to false
                        show_row_actions: false,
                        allow_row_reorder: true
                    };
                }

                // Setup enhanced features
                if (grid.setup_enhanced_features) {
                    grid.setup_enhanced_features();
                }

                // Enhance existing rows
                if (grid.grid_rows) {
                    grid.grid_rows.forEach(row => {
                        if (row.setup_enhanced_row_features) {
                            row.setup_enhanced_row_features();
                        }
                    });
                }
            }
        });
    }
})();

