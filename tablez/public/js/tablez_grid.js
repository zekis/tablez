/**
 * Tablez Grid - Consolidated Grid Enhancement
 * All grid enhancement functionality in one file
 */

(function() {
    'use strict';

    let initialized = false;

    // Wait for first form with table to load
    $(document).on('form-load', function() {
        if (initialized) return;

        setTimeout(function() {
            if (!cur_frm || !cur_frm.fields_dict) return;

            // Find a table field
            const tableField = Object.values(cur_frm.fields_dict).find(f => f.df.fieldtype === 'Table');
            if (!tableField || !tableField.grid) return;

            // Get the Grid class from the instance
            const GridClass = tableField.grid.constructor;
            if (!GridClass || GridClass.prototype._tablez_initialized) return;

            initialized = true;
            console.log('Tablez: Initializing enhanced grid...');
            initTablezGrid(GridClass);

            // Enhance existing grids on current form
            setTimeout(function() {
                enhanceExistingGrids();
            }, 500);
        }, 100);
    });

    function initTablezGrid(GridClass) {
        console.log('Tablez: Adding methods to Grid class...');

        // Store original methods
        const original_make = GridClass.prototype.make;
        const original_refresh = GridClass.prototype.refresh;

        /**
         * Override make() to setup enhanced features
         */
        GridClass.prototype.make = function() {
            original_make.call(this);

            if (this.wrapper && this.wrapper.hasClass('tablez-enhanced-grid')) {
                this.setup_enhanced_features();
            }
        };

        /**
         * Override refresh() to reapply enhancements
         */
        GridClass.prototype.refresh = function() {
            original_refresh.call(this);

            if (this.wrapper && this.wrapper.hasClass('tablez-enhanced-grid')) {
                this.apply_enhanced_refresh();
            }
        };

        /**
         * Setup enhanced features (called once during make)
         */
        GridClass.prototype.setup_enhanced_features = function() {
            if (!this.enhanced_config || !this.enhanced_config.enabled) return;

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
         * Apply enhancements during refresh
         */
        GridClass.prototype.apply_enhanced_refresh = function() {
            if (!this.enhanced_config || !this.enhanced_config.enabled) {
                return;
            }

            if (!this.enhanced_config.show_edit_button && !this.enhanced_config.show_delete_button) {
                this.apply_style_config();
            } else {
                this.apply_style_config_partial();
            }

            this.remove_hidden_columns();

            if (this.grid_rows) {
                this.grid_rows.forEach(row => {
                    if (row.setup_enhanced_row_features && row.doc) {
                        row.setup_enhanced_row_features(true);
                    }
                });
            }

            if (this.enhanced_config.show_total_row) {
                this.render_total_row();
            }

            if (this.enhanced_config.show_add_button) {
                this.setup_add_button();
            }

            this.apply_column_widths();
        };

        /**
         * Detect the primary link field to open when row is clicked
         */
        GridClass.prototype.detect_primary_link_field = function() {
            if (this.enhanced_config.primary_link_field) {
                return;
            }

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

            if (this.grid_buttons) {
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
         * Setup column sorting
         */
        GridClass.prototype.setup_sorting = function() {
            if (!this.enhanced_config.enable_sorting) return;

            const me = this;

            this.wrapper.on('click', '.grid-heading-row .col[data-fieldname]', function(e) {
                const $col = $(this);
                const fieldname = $col.attr('data-fieldname');

                if (!fieldname) return;

                const current_sort = $col.attr('data-sort-order') || 'none';
                let new_sort = 'asc';

                if (current_sort === 'asc') {
                    new_sort = 'desc';
                } else if (current_sort === 'desc') {
                    new_sort = 'none';
                }

                if (!e.shiftKey) {
                    me.wrapper.find('.grid-heading-row .col').attr('data-sort-order', 'none')
                        .find('.sort-indicator').remove();
                }

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

                if (val_a == null) return 1;
                if (val_b == null) return -1;

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
            const config = this.enhanced_config;

            if (config.hide_checkboxes) {
                this.wrapper.find('.grid-heading-row .row-check').remove();
                this.wrapper.find('.grid-body .data-row .row-check').remove();
            }

            if (config.hide_row_numbers) {
                this.wrapper.find('.grid-heading-row .row-index').remove();
                this.wrapper.find('.grid-body .data-row .row-index').remove();
            }
        };

        /**
         * Calculate actions column width based on enabled buttons
         */
        GridClass.prototype.calculate_actions_column_width = function() {
            const config = this.enhanced_config;

            // If manually specified and not 'auto', use it
            if (config.actions_column_width && config.actions_column_width !== 'auto') {
                return config.actions_column_width;
            }

            // Calculate based on enabled buttons
            let width = 20; // Base padding
            let buttonCount = 0;

            if (config.show_edit_button) {
                width += 40; // Edit button
                buttonCount++;
            }

            if (config.show_delete_button) {
                width += 40; // Delete button
                buttonCount++;
            }

            if (config.show_save_button) {
                width += 80; // Save button (wider with text)
                buttonCount++;
            }

            // Add gap between buttons (4px per gap)
            if (buttonCount > 1) {
                width += (buttonCount - 1) * 4;
            }

            // If no buttons, return 0 (column should be hidden)
            if (buttonCount === 0) {
                return '0px';
            }

            return width + 'px';
        };

        /**
         * Apply custom column widths to all rows
         */
        GridClass.prototype.apply_column_widths = function() {
            const me = this;
            const widths = this.enhanced_config.column_widths;
            const actionsWidth = this.calculate_actions_column_width();
            const autoWidth = this.enhanced_config.auto_column_width;

            function removeBootstrapColClasses($col) {
                const classes = ($col.attr('class') || '').split(/\s+/);
                const bootstrapColPattern = /^col-(xs|sm|md|lg|xl)-\d+$/;
                classes.forEach(function(cls) {
                    if (bootstrapColPattern.test(cls)) {
                        $col.removeClass(cls);
                    }
                });
            }

            function applyWidthStyles($col, width) {
                removeBootstrapColClasses($col);
                $col.css({
                    'width': width,
                    'min-width': width,
                    'max-width': width,
                    'flex': `0 0 ${width}`,
                    'box-sizing': 'border-box'
                });
            }

            function applyAutoWidthStyles($col) {
                removeBootstrapColClasses($col);
                $col.css({
                    'width': 'auto',
                    'min-width': '100px', // Minimum width for readability
                    'max-width': 'none',
                    'flex': '1 1 0',  // Grow evenly to fill remaining space
                    'box-sizing': 'border-box'
                });
            }

            this.wrapper.find('.grid-heading-row .col').each(function() {
                const $col = $(this);
                const fieldname = $col.attr('data-fieldname');

                if ($col.hasClass('tablez-actions-column')) {
                    applyWidthStyles($col, actionsWidth);
                } else if ($col.hasClass('row-check')) {
                    // Don't modify row-check column
                    return;
                } else if (widths && fieldname && widths[fieldname]) {
                    // Manual width specified
                    applyWidthStyles($col, widths[fieldname]);
                } else if (autoWidth && fieldname) {
                    // Auto width enabled - use flex to fill remaining space
                    applyAutoWidthStyles($col);
                }
            });

            this.wrapper.find('.grid-body .data-row').each(function() {
                $(this).find('.col').each(function() {
                    const $col = $(this);
                    const fieldname = $col.attr('data-fieldname');

                    if ($col.hasClass('tablez-actions-column')) {
                        applyWidthStyles($col, actionsWidth);
                    } else if ($col.hasClass('row-check')) {
                        // Don't modify row-check column
                        return;
                    } else if (widths && fieldname && widths[fieldname]) {
                        // Manual width specified
                        applyWidthStyles($col, widths[fieldname]);
                    } else if (autoWidth && fieldname) {
                        // Auto width enabled - use flex to fill remaining space
                        applyAutoWidthStyles($col);
                    }
                });
            });
        };

        /**
         * Setup total row
         */
        GridClass.prototype.setup_total_row = function() {
            if (!this.enhanced_config.show_total_row) return;
            this.wrapper.find('.tablez-total-row').remove();
        };

        /**
         * Calculate totals for configured columns
         */
        GridClass.prototype.calculate_totals = function() {
            const config = this.enhanced_config.total_row_config || {};
            const columns = config.columns || {};
            const totals = {};

            if (!this.grid_rows) {
                return totals;
            }

            const data = this.grid_rows
                .filter(row => row.doc && !row.doc.__islocal)
                .map(row => row.doc);

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
                    case 'avg':
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

            this.wrapper.find('.tablez-total-row').remove();

            const meta = frappe.get_meta(this.doctype);
            if (!meta) return;

            const $firstDataRow = this.wrapper.find('.grid-body .data-row:not(.tablez-total-row)').first();
            if (!$firstDataRow.length) return;

            const $totalRow = $firstDataRow.clone(false);
            $totalRow.removeClass().addClass('data-row row tablez-total-row m-0');
            $totalRow.removeAttr('data-name data-idx title');
            $totalRow.removeClass('tablez-readonly-row');

            const existingStyle = $totalRow.attr('style') || '';
            $totalRow.attr('style', existingStyle);
            $totalRow.css({
                'border-top': config.style?.borderTop || '2px solid #dee2e6',
                'background': config.style?.background || '#f8f9fa',
                'font-weight': config.style?.fontWeight || 'bold',
                'cursor': 'default',
                'pointer-events': 'none'
            });

            // Hide all field-area elements and show all static-area elements
            $totalRow.find('.field-area').hide();
            $totalRow.find('.static-area').show();

            $totalRow.find('.col').each(function() {
                const $col = $(this);
                if ($col.css('display') === 'none' &&
                    ($col.hasClass('row-check') || $col.hasClass('row-index'))) {
                    $col.remove();
                }
            });

            let isFirstDataCol = true;

            $totalRow.find('.col').each(function(index, col) {
                const $col = $(col);
                const fieldname = $col.attr('data-fieldname');
                const isLast = index === $totalRow.find('.col').length - 1;

                const isRowIndex = $col.hasClass('row-index');
                const isRowCheck = $col.hasClass('row-check');
                const isSortableHandle = $col.hasClass('sortable-handle');

                if (isRowIndex || isRowCheck || isSortableHandle) {
                    $col.empty().html('&nbsp;');
                } else if ($col.hasClass('tablez-actions-column') || isLast || !fieldname) {
                    $col.empty().html('&nbsp;');

                    if (!$col.hasClass('tablez-actions-column')) {
                        $col.addClass('tablez-actions-column');
                    }

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
                    let $staticArea = $col.find('.static-area');
                    if ($staticArea.length) {
                        $staticArea.empty().css('display', 'block');
                        $staticArea.html(config.label || 'Total');
                    }
                    isFirstDataCol = false;
                } else if (fieldname && totals[fieldname] !== undefined) {
                    const field = meta.fields.find(f => f.fieldname === fieldname);
                    const fieldtype = field ? field.fieldtype : 'Data';
                    let formatted_value = totals[fieldname];

                    if (fieldtype === 'Currency') {
                        formatted_value = format_currency(totals[fieldname], field.options);
                    } else if (fieldtype === 'Float') {
                        formatted_value = flt(totals[fieldname], field.precision || 2);
                    } else if (fieldtype === 'Int') {
                        formatted_value = cint(totals[fieldname]);
                    } else if (fieldtype === 'Percent') {
                        formatted_value = flt(totals[fieldname], 2) + '%';
                    }

                    let $staticArea = $col.find('.static-area');
                    if ($staticArea.length) {
                        $staticArea.empty().css('display', 'block');
                        const $innerDiv = $('<div style="text-align: right"></div>');
                        $innerDiv.html(formatted_value);
                        $staticArea.append($innerDiv);
                    }
                } else {
                    let $staticArea = $col.find('.static-area');
                    if ($staticArea.length) {
                        $staticArea.empty().html('&nbsp;');
                    }
                }
            });

            this.wrapper.find('.grid-body').append($totalRow);
        };

        /**
         * Setup custom Add and Save buttons in the grid footer
         */
        GridClass.prototype.setup_add_button = function() {
            if (!this.enhanced_config.show_add_button) {
                return;
            }

            const me = this;

            // Remove old buttons
            this.wrapper.find('.tablez-add-btn, .tablez-save-btn').remove();

            const buttonLabel = this.enhanced_config.add_button_label || 'Add Row';

            const $gridButtons = this.wrapper.find('.grid-footer .grid-buttons');
            if (!$gridButtons.length) {
                console.warn('Tablez: Grid footer not found');
                return;
            }

            const $addBtn = $(`
                <button type="button" class="btn btn-xs btn-success tablez-add-btn">
                    <svg class="icon icon-xs" style="fill: white;"><use href="#icon-add"></use></svg>
                    ${buttonLabel}
                </button>
            `);

            $addBtn.on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const action = me.enhanced_config.add_button_action || 'dialog';

                if (action === 'dialog') {
                    me.show_add_dialog();
                } else if (action === 'inline') {
                    me.add_new_row(null, null, true);
                } else if (action === 'link') {
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

            $gridButtons.prepend($addBtn);

            if (me.enhanced_config.show_save_button) {
                // Check if form has unsaved changes
                const formIsDirty = me.frm && me.frm.is_dirty && me.frm.is_dirty();

                if (formIsDirty) {
                    const $saveBtn = $(`
                        <button type="button" class="btn btn-xs btn-primary tablez-save-btn">
                            Save
                        </button>
                    `);

                    $saveBtn.on('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        if (me.frm) {
                            // Save with a callback to refresh after save completes
                            me.frm.save('Save', function() {
                                // Only refresh if save was successful (form is no longer dirty)
                                if (!me.frm.is_dirty || !me.frm.is_dirty()) {
                                    console.log('[Tablez Save] Before reload - checking row flags:');
                                    if (me.grid_rows) {
                                        me.grid_rows.forEach(function(row, idx) {
                                            if (row.doc) {
                                                console.log(`  Row ${idx}: __islocal=${row.doc.__islocal}, __unsaved=${row.doc.__unsaved}`);
                                            }
                                        });
                                    }

                                    // Reload the document from server to get fresh data
                                    me.frm.reload_doc().then(function() {
                                        console.log('[Tablez Save] After reload - checking row flags:');
                                        if (me.grid_rows) {
                                            me.grid_rows.forEach(function(row, idx) {
                                                if (row.doc) {
                                                    console.log(`  Row ${idx}: __islocal=${row.doc.__islocal}, __unsaved=${row.doc.__unsaved}`);
                                                }
                                            });
                                        }

                                        // After reload, refresh the field to rebuild the grid
                                        if (me.df && me.df.fieldname) {
                                            me.frm.refresh_field(me.df.fieldname);
                                        }

                                        console.log('[Tablez Save] After refresh_field - checking row flags:');
                                        setTimeout(function() {
                                            if (me.grid_rows) {
                                                me.grid_rows.forEach(function(row, idx) {
                                                    if (row.doc) {
                                                        console.log(`  Row ${idx}: __islocal=${row.doc.__islocal}, __unsaved=${row.doc.__unsaved}`);
                                                    }
                                                });
                                            }
                                        }, 100);
                                    });
                                }
                            });
                        } else {
                            frappe.msgprint(__('Unable to save: Form not found'));
                        }
                    });

                    $addBtn.after($saveBtn);
                }
            }
        };

        /**
         * Show dialog to add new row
         */
        GridClass.prototype.show_add_dialog = function() {
            const me = this;

            const meta = frappe.get_meta(this.doctype);

            if (!meta || !meta.fields) {
                frappe.msgprint('Could not load child table fields');
                return;
            }

            const dialog_fields = [];

            meta.fields.forEach(function(field) {
                if (field.fieldname === 'name' || field.fieldname === 'idx' ||
                    field.fieldname === 'parent' || field.fieldname === 'parenttype' ||
                    field.fieldname === 'parentfield' || field.fieldname === 'docstatus') {
                    return;
                }

                if (field.read_only || field.hidden) {
                    return;
                }

                dialog_fields.push({
                    fieldtype: field.fieldtype,
                    fieldname: field.fieldname,
                    label: field.label,
                    options: field.options,
                    reqd: field.reqd,
                    default: field.default,
                    description: field.description
                });
            });

            const d = new frappe.ui.Dialog({
                title: `Add ${this.df.label || 'Row'}`,
                fields: dialog_fields,
                primary_action_label: 'Add',
                primary_action: function(values) {
                    const new_row = me.add_new_row();

                    Object.keys(values).forEach(function(fieldname) {
                        if (values[fieldname] !== undefined && values[fieldname] !== null) {
                            new_row[fieldname] = values[fieldname];
                        }
                    });

                    if (me.frm) {
                        me.frm.dirty();
                    }

                    me.refresh();

                    me.grid_rows.forEach(function(grid_row) {
                        if (grid_row.doc && grid_row.setup_enhanced_row_features) {
                            grid_row.setup_enhanced_row_features(true);
                        }
                    });

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

            this.render_grouped_grid(group_field);
        };

        /**
         * Render grid with grouping
         */
        GridClass.prototype.render_grouped_grid = function(group_field) {
            const data = this.get_data();
            const groups = {};

            data.forEach(row => {
                const group_value = row[group_field] || __('Ungrouped');
                if (!groups[group_value]) {
                    groups[group_value] = [];
                }
                groups[group_value].push(row);
            });

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

            if (config.hide_row_numbers) {
                this.wrapper.find('.row-index').hide();
                this.wrapper.find('.grid-heading-row .row-index').hide();
            }

            if (config.hide_checkboxes) {
                this.wrapper.find('.row-check').hide();
                this.wrapper.find('.grid-row-check').hide();
                this.wrapper.find('.grid-heading-row .row-check').hide();
            }

            if (config.hide_add_row_button) {
                this.wrapper.find('.grid-add-row').hide();
                this.wrapper.find('.grid-add-row-dialog').hide();
            }

            if (!config.show_row_actions) {
                this.wrapper.find('.grid-row-actions').hide();
            }

            // Always hide bulk actions in Tablez
            this.wrapper.find('.grid-bulk-actions').hide();
            this.wrapper.find('.grid-footer-toolbar .btn-group').hide();

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

            if (config.hide_row_numbers) {
                this.wrapper.find('.row-index').hide();
                this.wrapper.find('.grid-heading-row .row-index').hide();
            }

            if (config.hide_checkboxes) {
                this.wrapper.find('.row-check').hide();
                this.wrapper.find('.grid-row-check').hide();
                this.wrapper.find('.grid-heading-row .row-check').hide();
            }

            if (config.show_edit_button || config.show_delete_button) {
                this.wrapper.find('.grid-heading-row .data-row .col:last-child a').hide();
                this.wrapper.find('.grid-body .data-row .col:last-child .btn-open-row').hide();

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
                this.wrapper.find('.grid-heading-row .data-row .col:last-child').remove();
                this.wrapper.find('.grid-body .data-row .col:last-child').remove();
            }

            if (config.hide_add_row_button) {
                this.wrapper.find('.grid-add-row').hide();
                this.wrapper.find('.grid-add-row-dialog').hide();
            }

            if (!config.show_row_actions) {
                this.wrapper.find('.grid-row-actions').hide();
            }

            // Always hide bulk actions in Tablez
            this.wrapper.find('.grid-bulk-actions').hide();
            this.wrapper.find('.grid-footer-toolbar .btn-group').hide();

            if (!config.enable_row_click) {
                this.wrapper.find('.data-row').css('cursor', '');
            }

            if (config.custom_css) {
                if (!this.wrapper.find('.tablez-custom-style').length) {
                    this.wrapper.append(`<style class="tablez-custom-style">${config.custom_css}</style>`);
                }
            }
        };

        /**
         * Configure enhanced grid - Main configuration method
         */
        GridClass.prototype.configure_enhanced_grid = function(config) {
            const DEFAULT_CONFIG = {
                enabled: true,
                primary_link_field: null,
                show_add_button: false,
                add_button_label: 'Add Row',
                add_button_action: 'dialog',
                enable_sorting: true,
                enable_grouping: false,
                enhanced_link_clicks: false,
                show_edit_button: false,
                show_delete_button: false,
                show_save_button: true,
                confirm_delete: true,
                show_row_actions: false,
                allow_row_reorder: true,
                enable_row_click: false,
                row_click_action: 'open_document',
                row_shift_click_action: 'open_editor',
                row_click_tooltip: null,
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
                auto_column_width: false,
                actions_column_width: 'auto',
                hide_row_numbers: false,
                hide_checkboxes: false,
                hide_edit_icon: false,
                hide_add_row_button: false,
                custom_css: null
            };

            this.enhanced_config = Object.assign({}, DEFAULT_CONFIG, config);
            this.enhanced_config._user_configured = true;

            this.wrapper.addClass('tablez-enhanced-grid');

            this.setup_enhanced_features();
            this.refresh();

            if (this.grid_rows) {
                this.grid_rows.forEach(row => {
                    if (row.setup_enhanced_row_features && row.doc) {
                        row.setup_enhanced_row_features();
                    }
                });
            }
        };

        /**
         * Disable enhanced grid
         */
        GridClass.prototype.disable_enhanced_grid = function() {
            this.enhanced_config.enabled = false;
            this.refresh();
        };

        GridClass.prototype._tablez_initialized = true;

        console.log('Tablez: Grid class initialized successfully');
    }

    /**
     * Enhance existing grids on the current form
     */
    function enhanceExistingGrids() {
        if (!cur_frm || !cur_frm.fields_dict) return;

        console.log('[Tablez] Enhancing existing grids on form:', cur_frm.doctype);

        Object.values(cur_frm.fields_dict).forEach(function(field) {
            if (field.df.fieldtype === 'Table' && field.grid) {
                const grid = field.grid;

                if (grid.enhanced_config && grid.enhanced_config._user_configured) {
                    console.log('Tablez: Re-enhancing grid for field:', field.df.fieldname);

                    if (grid.setup_enhanced_features) {
                        grid.setup_enhanced_features();
                    }

                    if (grid.refresh) {
                        grid.refresh();
                    }
                }
            }
        });
    }

})();

