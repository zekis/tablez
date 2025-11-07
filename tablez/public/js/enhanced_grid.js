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

        // Store original make method
        const original_make = GridClass.prototype.make;
        const original_refresh = GridClass.prototype.refresh;

        // Override make method
        GridClass.prototype.make = function() {
            // Call original
            original_make.call(this);

            // Only setup enhanced features if this grid has been explicitly configured
            if (this.wrapper.hasClass('tablez-enhanced-grid')) {
                this.setup_enhanced_features();
            }
        };

        // Override refresh to reapply styles
        GridClass.prototype.refresh = function() {
            // Call original
            original_refresh.call(this);

            // Only apply enhancements if this grid has the marker class
            if (this.wrapper.hasClass('tablez-enhanced-grid')) {
                // Don't apply style config immediately if enhanced_link_clicks is enabled
                // because we need the last column for Edit buttons
                if (!this.enhanced_config.enhanced_link_clicks) {
                    this.apply_style_config();
                } else {
                    // Apply other styles but skip the edit column hiding
                    this.apply_style_config_partial();
                }

                // Remove hidden columns from all rows
                this.remove_hidden_columns();

                // Enhance all rows and render total row after refresh
                const me = this;
                setTimeout(function() {
                    // Enhance all existing rows to add action buttons
                    if (me.grid_rows) {
                        me.grid_rows.forEach(row => {
                            if (row.setup_enhanced_row_features && row.doc) {
                                row.setup_enhanced_row_features();
                            }
                        });
                    }

                    // Render total row
                    if (me.enhanced_config.show_total_row) {
                        me.render_total_row();
                    }

                    // Setup add button row
                    if (me.enhanced_config.show_add_button) {
                        me.setup_add_button();
                    }

                    // Apply custom column widths AFTER all rows are ready
                    me.apply_column_widths();
                }, 100);
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
        this.setup_total_row();
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
     * Remove hidden columns from all rows in the grid
     */
    GridClass.prototype.remove_hidden_columns = function() {
        const me = this;
        const config = this.enhanced_config;

        // Remove row-check columns if hide_checkboxes is enabled
        if (config.hide_checkboxes) {
            this.wrapper.find('.grid-heading-row .row-check').remove();
            this.wrapper.find('.grid-body .data-row .row-check').remove();
        }

        // Remove row-index columns if hide_row_numbers is enabled
        if (config.hide_row_numbers) {
            this.wrapper.find('.grid-heading-row .row-index').remove();
            this.wrapper.find('.grid-body .data-row .row-index').remove();
        }
    };

    /**
     * Apply custom column widths to all rows
     */
    GridClass.prototype.apply_column_widths = function() {
        const me = this;
        const widths = this.enhanced_config.column_widths;
        const actionsWidth = this.enhanced_config.actions_column_width || '120px';



        // Helper function to remove Bootstrap column classes
        function removeBootstrapColClasses($col) {
            const classes = ($col.attr('class') || '').split(/\s+/);
            const bootstrapColPattern = /^col-(xs|sm|md|lg|xl)-\d+$/;
            classes.forEach(function(cls) {
                if (bootstrapColPattern.test(cls)) {
                    $col.removeClass(cls);
                }
            });
        }

        // Helper function to apply width styles
        function applyWidthStyles($col, width) {
            // Remove Bootstrap column classes to avoid conflicts
            removeBootstrapColClasses($col);

            // Apply custom width with box-sizing to include padding
            $col.css({
                'width': width,
                'min-width': width,
                'max-width': width,
                'flex': `0 0 ${width}`,
                'box-sizing': 'border-box'
            });
        }

        // Always apply actions column width, even if column_widths is not configured
        // Apply to header row
        this.wrapper.find('.grid-heading-row .col').each(function() {
            const $col = $(this);
            const fieldname = $col.attr('data-fieldname');

            if ($col.hasClass('tablez-actions-column')) {
                applyWidthStyles($col, actionsWidth);
            } else if (widths && fieldname && widths[fieldname]) {
                applyWidthStyles($col, widths[fieldname]);
            }
        });

        // Apply to all data rows (including total row and add row)
        this.wrapper.find('.grid-body .data-row').each(function() {
            $(this).find('.col').each(function() {
                const $col = $(this);
                const fieldname = $col.attr('data-fieldname');

                if ($col.hasClass('tablez-actions-column')) {
                    applyWidthStyles($col, actionsWidth);
                } else if (widths && fieldname && widths[fieldname]) {
                    applyWidthStyles($col, widths[fieldname]);
                }
            });
        });
    };

    /**
     * Setup total row
     */
    GridClass.prototype.setup_total_row = function() {
        if (!this.enhanced_config.show_total_row) return;

        const me = this;

        // Remove existing total row if present
        this.wrapper.find('.tablez-total-row').remove();

        // We'll render the total row in render_total_row() which is called after data changes
    };

    /**
     * Calculate totals for configured columns
     */
    GridClass.prototype.calculate_totals = function() {
        const config = this.enhanced_config.total_row_config || {};
        const columns = config.columns || {};
        const totals = {};

        // Get all data rows
        const data = this.grid_rows
            .filter(row => row.doc && !row.doc.__islocal)
            .map(row => row.doc);

        // Calculate totals for each configured column
        Object.keys(columns).forEach(fieldname => {
            const operation = columns[fieldname];
            const values = data.map(doc => {
                const val = doc[fieldname];
                return (val == null || val === '') ? 0 : parseFloat(val) || 0;
            }).filter(v => !isNaN(v));

            switch (operation) {
                case 'sum':
                    totals[fieldname] = values.reduce((a, b) => a + b, 0);
                    break;
                case 'average':
                    totals[fieldname] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                    break;
                case 'count':
                    totals[fieldname] = values.length;
                    break;
                case 'min':
                    totals[fieldname] = values.length > 0 ? Math.min(...values) : 0;
                    break;
                case 'max':
                    totals[fieldname] = values.length > 0 ? Math.max(...values) : 0;
                    break;
                default:
                    totals[fieldname] = 0;
            }
        });

        return totals;
    };

    /**
     * Render the total row
     */
    GridClass.prototype.render_total_row = function() {
        if (!this.enhanced_config.show_total_row) return;

        const me = this;
        const config = this.enhanced_config.total_row_config || {};
        const totals = this.calculate_totals();

        // Remove existing total row
        this.wrapper.find('.tablez-total-row').remove();

        // Get meta for field types
        const meta = frappe.get_meta(this.doctype);
        if (!meta) return;

        // Get a reference data row to clone structure from
        const $firstDataRow = this.wrapper.find('.grid-body .data-row:not(.tablez-add-row-dummy):not(.tablez-total-row)').first();
        if (!$firstDataRow.length) return;

        // Clone the entire row structure (without event handlers)
        const $totalRow = $firstDataRow.clone(false);
        $totalRow.removeClass().addClass('data-row row tablez-total-row m-0');
        $totalRow.removeAttr('data-name data-idx title');

        // Remove any tablez-specific classes that might interfere
        $totalRow.removeClass('tablez-readonly-row');

        // Apply total row styling (keep existing inline styles, just add our overrides)
        const existingStyle = $totalRow.attr('style') || '';
        $totalRow.attr('style', existingStyle);
        $totalRow.css({
            'border-top': config.style?.borderTop || '2px solid #dee2e6',
            'background': config.style?.background || '#f8f9fa',
            'font-weight': config.style?.fontWeight || 'bold',
            'cursor': 'default',
            'pointer-events': 'none'
        });

        // Remove hidden columns from total row
        $totalRow.find('.col').each(function() {
            const $col = $(this);
            if ($col.css('display') === 'none' &&
                ($col.hasClass('row-check') || $col.hasClass('row-index'))) {
                $col.remove();
            }
        });

        let isFirstDataCol = true;

        // Update each column's content
        $totalRow.find('.col').each(function(index, col) {
            const $col = $(col);
            const fieldname = $col.attr('data-fieldname');
            const isLast = index === $totalRow.find('.col').length - 1;

            // Check if this is a special column
            const isRowIndex = $col.hasClass('row-index');
            const isRowCheck = $col.hasClass('row-check');
            const isSortableHandle = $col.hasClass('sortable-handle');

            if (isRowIndex || isRowCheck || isSortableHandle) {
                // For visible row numbers, checkboxes, and sortable handles - keep but empty
                $col.empty().html('&nbsp;');
            } else if ($col.hasClass('tablez-actions-column') || isLast || !fieldname) {
                // Actions column - keep it empty but maintain structure
                $col.empty().html('&nbsp;');

                // Ensure it has the tablez-actions-column class
                if (!$col.hasClass('tablez-actions-column')) {
                    $col.addClass('tablez-actions-column');
                }

                // Apply the configured actions column width
                const actionsWidth = me.enhanced_config.actions_column_width || '120px';
                $col.css({
                    'gap': '4px',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'min-width': actionsWidth,
                    'width': actionsWidth,
                    'max-width': actionsWidth,
                    'flex': `0 0 ${actionsWidth}`
                });
            } else if (isFirstDataCol && fieldname) {
                // First data column - show label
                // Find the static-area
                let $staticArea = $col.find('.static-area');
                if ($staticArea.length) {
                    // Clear the static area and set the label
                    $staticArea.empty().css('display', 'block');
                    $staticArea.html(config.label || 'Total');
                }
                isFirstDataCol = false;
            } else if (fieldname && totals[fieldname] !== undefined) {
                // Column has a total - format and display it
                const field = meta.fields.find(f => f.fieldname === fieldname);
                const fieldtype = field ? field.fieldtype : 'Data';
                let formatted_value = totals[fieldname];

                // Format based on field type
                if (fieldtype === 'Currency') {
                    formatted_value = format_currency(totals[fieldname], field.options);
                } else if (fieldtype === 'Float') {
                    formatted_value = flt(totals[fieldname], field.precision || 2);
                } else if (fieldtype === 'Int') {
                    formatted_value = cint(totals[fieldname]);
                } else if (fieldtype === 'Percent') {
                    formatted_value = flt(totals[fieldname], 2) + '%';
                }

                // Find the static-area
                let $staticArea = $col.find('.static-area');
                if ($staticArea.length) {
                    // Clear the static area
                    $staticArea.empty().css('display', 'block');

                    // Create inner div with right alignment (matching Frappe's structure)
                    const $innerDiv = $('<div style="text-align: right"></div>');
                    $innerDiv.html(formatted_value);
                    $staticArea.append($innerDiv);
                }
            } else {
                // No total for this column - leave empty
                let $staticArea = $col.find('.static-area');
                if ($staticArea.length) {
                    $staticArea.empty().html('&nbsp;');
                }
            }
        });

        // Insert total row before the Add button row (if exists) or at the end
        const $addRow = this.wrapper.find('.tablez-add-row-dummy');
        if ($addRow.length) {
            $addRow.before($totalRow);
        } else {
            this.wrapper.find('.grid-body').append($totalRow);
        }

        // Note: Column widths will be applied by apply_column_widths() after this function
    };

    /**
     * Setup custom Add button in a dummy row
     */
    GridClass.prototype.setup_add_button = function() {
        if (!this.enhanced_config.show_add_button) return;

        const me = this;

        // Remove existing dummy row if present
        this.wrapper.find('.tablez-add-row-dummy').remove();

        // Get the button label from config
        const buttonLabel = this.enhanced_config.add_button_label || 'Add Row';

        // Create a dummy row with same structure as data rows
        const $dummyRow = $(`
            <div class="data-row row tablez-add-row-dummy m-0"
                 style="border-top: 1px solid var(--border-color, #d1d8dd);">
            </div>
        `);

        // Get all columns from an actual data row
        const $firstDataRow = this.wrapper.find('.grid-body .data-row:not(.tablez-add-row-dummy):not(.tablez-total-row)').first();
        if (!$firstDataRow.length) return;

        const $allCols = $firstDataRow.find('.col');

        // Clone all columns
        let colIndex = 0;
        $allCols.each(function(index, col) {
            const $col = $(col);
            const fieldname = $col.attr('data-fieldname');
            const colClass = $col.attr('class');

            if (colIndex === 0) {
                // First column - add the Add button here
                const $firstCol = $(`<div class="${colClass}" style="padding: 8px;"></div>`);
                $firstCol.attr('data-fieldname', fieldname);

                const $addBtn = $(`
                    <button class="btn btn-xs btn-success">
                        <svg class="icon icon-xs"><use href="#icon-add"></use></svg>
                        ${buttonLabel}
                    </button>
                `);

                $addBtn.on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    const action = me.enhanced_config.add_button_action || 'dialog';

                    if (action === 'dialog') {
                        // Show dialog to add row
                        me.show_add_dialog();
                    } else if (action === 'inline') {
                        // Add row inline like Frappe's default
                        me.add_new_row(null, null, true);
                    } else if (action === 'link') {
                        // Open the linked document's new form
                        const linkField = me.enhanced_config.primary_link_field;
                        if (linkField) {
                            const meta = frappe.get_meta(me.doctype);
                            const field = meta.fields.find(f => f.fieldname === linkField);
                            if (field && field.options) {
                                frappe.new_doc(field.options);
                            } else {
                                frappe.msgprint(__('Link field not found or has no options'));
                            }
                        } else {
                            frappe.msgprint(__('No primary_link_field configured'));
                        }
                    }
                });

                $firstCol.append($addBtn);
                $dummyRow.append($firstCol);
            } else {
                // Other columns - empty
                const $emptyCol = $(`<div class="${colClass}" style="padding: 8px;"></div>`);
                if (fieldname) {
                    $emptyCol.attr('data-fieldname', fieldname);
                }
                $dummyRow.append($emptyCol);
            }
            colIndex++;
        });

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
        // Initialize with default config, then merge user config
        const DEFAULT_CONFIG = {
            enabled: true,
            primary_link_field: null,
            show_add_dialog: false,
            show_add_button: false,
            add_button_label: 'Add Row',
            add_button_action: 'dialog',  // 'dialog' | 'inline' | 'link'
            enable_sorting: true,
            enable_grouping: false,
            enhanced_link_clicks: false,
            show_edit_button: false,
            show_delete_button: false,
            show_row_actions: false,
            allow_row_reorder: true,
            enable_row_click: false,
            show_total_row: false,
            total_row_config: {
                label: 'Total',
                columns: {},
                style: {
                    background: '#f8f9fa',
                    fontWeight: 'bold',
                    borderTop: '2px solid #dee2e6'
                }
            },
            column_widths: null,
            actions_column_width: '120px',
            hide_row_numbers: false,
            hide_checkboxes: false,
            hide_edit_icon: false,
            hide_add_row_button: false,
            hide_bulk_actions: false,
            custom_css: null
        };

        this.enhanced_config = Object.assign({}, DEFAULT_CONFIG, config);
        this.enhanced_config._user_configured = true;

        // Add marker class to identify this as an enhanced grid
        this.wrapper.addClass('tablez-enhanced-grid');

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

