/**
 * Enhanced Grid Row - Custom row behavior for child tables
 * Handles row-level interactions and link field enhancements
 */

(function() {
    'use strict';

    // Wait for first form with table to load, then get GridRow class from instance
    let initialized = false;

    $(document).on('form-load', function() {
        if (initialized) return;

        // Wait a bit for form to fully render
        setTimeout(function() {
            if (!cur_frm || !cur_frm.fields_dict) return;

            // Find a table field
            const tableField = Object.values(cur_frm.fields_dict).find(f => f.df.fieldtype === 'Table');
            if (!tableField || !tableField.grid || !tableField.grid.grid_rows || !tableField.grid.grid_rows[0]) return;

            // Get the GridRow class from the instance
            const GridRowClass = tableField.grid.grid_rows[0].constructor;
            if (!GridRowClass || GridRowClass.prototype._enhanced_grid_row_initialized) return;

            initialized = true;
            initEnhancedGridRow(GridRowClass);
        }, 150);
    });

    function initEnhancedGridRow(GridRowClass) {
        console.log('Initializing Enhanced Grid Row...');

        // Store original make method
        const original_make = GridRowClass.prototype.make;

        // Override make method
        GridRowClass.prototype.make = function() {
            // Call original
            original_make.call(this);

            // Setup enhanced row features
            this.setup_enhanced_row_features();
        };

        /**
         * Setup enhanced row features
         * Can be called multiple times to re-enhance (e.g., after data changes)
         */
        GridRowClass.prototype.setup_enhanced_row_features = function(force_refresh) {
        // Skip if already setup, unless force_refresh is true
        if (this.enhanced_features_setup && !force_refresh) return;

        // Only setup enhanced features if this grid has been explicitly configured
        if (!this.grid.wrapper.hasClass('tablez-enhanced-grid')) {
            return;
        }

        // Grid must have enhanced_config if it has the marker class
        if (!this.grid.enhanced_config) {
            console.warn('Grid has tablez-enhanced-grid class but no enhanced_config');
            return;
        }

        const grid_config = this.grid.enhanced_config;
        if (!grid_config.enabled) return;

        // Add/remove unsaved class based on row state
        if (this.doc && this.row) {
            // Check for truthy values (Frappe uses 1 for unsaved, undefined for saved)
            // Use !! to convert to boolean, then check if true
            const isUnsaved = !!(this.doc.__islocal || this.doc.__unsaved);

            // Always remove first to ensure clean state
            this.row.removeClass('tablez-unsaved-row');

            // Then add if needed
            if (isUnsaved) {
                this.row.addClass('tablez-unsaved-row');
            }
        }

        // Only setup row click if enabled
        if (grid_config.enable_row_click) {
            this.setup_row_click_handler(grid_config);
        } else {
            // Make sure row doesn't have custom cursor/title
            if (this.row) {
                this.row.css('cursor', '');
                this.row.removeAttr('title');
            }
        }

        this.enhance_link_fields(grid_config);
        this.add_row_actions(grid_config);
        this.setup_row_hover();

        this.enhanced_features_setup = true;
    };

    /**
     * Setup row hover effect
     */
    GridRowClass.prototype.setup_row_hover = function() {
        // Skip if this is a header row (no doc)
        if (!this.doc) return;

        const $row = this.row;

        $row.on('mouseenter', function() {
            // Set background on the .col children directly - light pastel green
            $(this).children().css('background-color', 'rgb(230, 245, 230)');
        });

        $row.on('mouseleave', function() {
            // Clear background on the .col children
            $(this).children().css('background-color', '');
        });
    };

    /**
     * Setup click handler to open referenced document and make row read-only
     */
    GridRowClass.prototype.setup_row_click_handler = function(config) {
        // Skip if this is a header row (no doc)
        if (!this.doc) return;

        // Skip if row click is disabled
        if (!config.enable_row_click) return;

        const me = this;
        const primary_link = config.primary_link_field;

        if (!primary_link) return;

        // Make the row completely read-only
        // Remove the editable-row class that Frappe adds
        this.row.removeClass('editable-row');
        this.row.addClass('tablez-readonly-row');

        // Force hide field areas and show static areas with !important via inline style
        this.row.find('.field-area').css('display', 'none');
        this.row.find('.static-area').css('display', 'block');

        // Disable all inputs to prevent editing
        this.row.find('input, select, textarea').prop('disabled', true).prop('readonly', true);

        // Add pointer cursor to indicate clickability
        this.row.css('cursor', 'pointer');

        // Generate tooltip text based on configuration
        let tooltipText;
        if (config.row_click_tooltip) {
            // Use custom tooltip if provided
            tooltipText = config.row_click_tooltip;
        } else {
            // Auto-generate tooltip based on actions
            const normalClickAction = config.row_click_action || 'open_document';
            const shiftClickAction = config.row_shift_click_action || 'open_editor';

            const normalText = normalClickAction === 'open_editor' ? 'edit row' : `open ${primary_link}`;
            const shiftText = shiftClickAction === 'open_editor' ? 'edit row' : `open ${primary_link}`;

            tooltipText = `Click to ${normalText}, Shift+Click to ${shiftText}`;
        }

        this.row.attr('title', tooltipText);

        // Override the toggle_view to prevent automatic editing
        const original_toggle_view = this.toggle_view;
        this.toggle_view = function(show) {
            // Prevent showing edit mode unless explicitly requested
            if (show === true) {
                // Remove readonly class temporarily
                me.row.removeClass('tablez-readonly-row');
                me.row.addClass('editable-row');
                return original_toggle_view.call(this, show);
            } else {
                // Hide edit mode and restore readonly
                const result = original_toggle_view.call(this, show);
                me.row.removeClass('editable-row');
                me.row.addClass('tablez-readonly-row');
                me.row.find('.field-area').css('display', 'none');
                me.row.find('.static-area').css('display', 'block');
                return result;
            }
        };

        // Remove ALL click handlers
        this.row.off('click');
        this.row.off('dblclick');

        // Use native addEventListener with capture phase to intercept clicks BEFORE Frappe
        const rowElement = this.row[0];

        const clickHandler = function(e) {
            // Don't trigger if clicking on buttons
            const $target = $(e.target);
            if ($target.closest('button').length) {
                return;
            }

            // Stop event immediately in capture phase
            e.stopImmediatePropagation();
            e.preventDefault();

            // Determine which action to take based on configuration
            const normalClickAction = config.row_click_action || 'open_document';
            const shiftClickAction = config.row_shift_click_action || 'open_editor';

            // Select action based on Shift key
            const action = e.shiftKey ? shiftClickAction : normalClickAction;

            // Execute the appropriate action
            if (action === 'open_editor') {
                me.toggle_view(true);
                return;
            }

            // Otherwise, open the document (action === 'open_document')
            const link_value = me.doc[primary_link];

            if (link_value) {
                // Get the linked doctype
                const meta = frappe.get_meta(me.doc.doctype);
                const link_field = meta.fields.find(f => f.fieldname === primary_link);

                if (link_field && link_field.options) {
                    // Open the linked document
                    if (e.ctrlKey || e.metaKey) {
                        // Open in new tab
                        window.open(`/app/${frappe.router.slug(link_field.options)}/${link_value}`, '_blank');
                    } else {
                        // Open in same tab
                        frappe.set_route('Form', link_field.options, link_value);
                    }
                }
            }
        };

        const dblClickHandler = function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
        };

        // Add listeners in CAPTURE phase (true parameter)
        rowElement.addEventListener('click', clickHandler, true);
        rowElement.addEventListener('dblclick', dblClickHandler, true);
    };

    /**
     * Enhance link fields with proper Edit/Delete buttons in Actions column
     */
    GridRowClass.prototype.enhance_link_fields = function(config) {
        // Skip if neither Edit nor Delete buttons are enabled
        if (!config.show_edit_button && !config.show_delete_button) {
            return;
        }

        const me = this;

        // Check if this is a header row first
        if (!this.doc) {
            // For header row, check if child table has any link fields
            const grid_meta = frappe.get_meta(this.grid.doctype);
            if (!grid_meta || !grid_meta.fields) return;

            const has_link_field = grid_meta.fields.some(f => f.fieldtype === 'Link');

            if (has_link_field) {
                // Leave the header column empty (no label)
                const $lastCol = this.row.find('.col:last-child');
                if ($lastCol.length && !$lastCol.hasClass('tablez-actions-column')) {
                    $lastCol.empty();

                    // Force the header column to match the data column width
                    $lastCol.css({
                        'min-width': '120px',
                        'width': '120px',
                        'flex': '0 0 120px',
                        'text-align': 'center'
                    });

                    // Add a class to identify this as the actions column header
                    $lastCol.addClass('tablez-actions-column');
                }
            }
            return;
        }

        // For data rows, get the meta
        const meta = frappe.get_meta(this.doc.doctype);
        if (!meta || !meta.fields) return;

        // Find the primary link field (or first link field)
        const primary_link = config.primary_link_field;
        let link_field = null;

        if (primary_link) {
            link_field = meta.fields.find(f => f.fieldname === primary_link && f.fieldtype === 'Link');
        }

        if (!link_field) {
            // Use first link field
            link_field = meta.fields.find(f => f.fieldtype === 'Link');
        }

        // If no link field exists in this child table, don't show Actions column
        if (!link_field) {
            return;
        }

        const has_link = me.doc[link_field.fieldname];

        // Hide the tiny default arrow in the link field
        if (has_link) {
            const $field = this.row.find(`[data-fieldname="${link_field.fieldname}"]`);
            $field.find('.btn-open').hide();
        }

        // Find the last column (where edit icon was)
        const $lastCol = this.row.find('.col:last-child');

        // Check if buttons already exist
        const hasDeleteBtn = $lastCol.find('.tablez-delete-link').length > 0;
        const hasEditBtn = $lastCol.find('.tablez-edit-link').length > 0;

        // Always process if: no buttons exist, OR we have a link but no Edit button
        if ($lastCol.length && (!hasDeleteBtn || (has_link && !hasEditBtn))) {
            // Only clear if we're rebuilding from scratch
            if (!hasDeleteBtn) {
                $lastCol.empty();

                // Get the configured actions column width
                const actionsWidth = config.actions_column_width || '120px';

                // Force the column to be visible and have proper width
                // This overrides any column width settings from DocType (e.g., width: 0)
                $lastCol.css({
                    'display': 'flex !important',
                    'gap': '4px',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'min-width': actionsWidth,
                    'width': actionsWidth,
                    'max-width': actionsWidth,
                    'flex': `0 0 ${actionsWidth}`
                });

                // Add a class to identify this as the actions column
                $lastCol.addClass('tablez-actions-column');
            }

            // Only add Edit button if enabled, there's a link value, and it doesn't exist
            if (config.show_edit_button && has_link && !hasEditBtn) {
                const $editBtn = $(`
                    <button class="btn btn-xs tablez-edit-link"
                            style="padding: 2px 6px; background: transparent; border: none; color: var(--text-muted);"
                            title="Edit ${link_field.options}">
                        <svg class="icon icon-sm"><use href="#icon-edit"></use></svg>
                    </button>
                `);

                // Hover effect
                $editBtn.on('mouseenter', function() {
                    $(this).css('color', 'var(--primary)');
                });
                $editBtn.on('mouseleave', function() {
                    $(this).css('color', 'var(--text-muted)');
                });

                $editBtn.on('click', function(e) {
                    e.stopPropagation();
                    const link_value = me.doc[link_field.fieldname];

                    if (link_value && link_field.options) {
                        if (e.ctrlKey || e.metaKey) {
                            // Open in new tab
                            window.open(`/app/${frappe.router.slug(link_field.options)}/${link_value}`, '_blank');
                        } else {
                            // Open in same tab
                            frappe.set_route('Form', link_field.options, link_value);
                        }
                    }
                });

                // Prepend Edit button before Delete
                $lastCol.prepend($editBtn);
            }

            // Only add Delete button if enabled and it doesn't exist
            if (config.show_delete_button && !hasDeleteBtn) {
                const $deleteBtn = $(`
                    <button class="btn btn-xs tablez-delete-link"
                            style="padding: 2px 6px; background: transparent; border: none; color: var(--text-muted);"
                            title="Delete">
                        <svg class="icon icon-sm"><use href="#icon-delete"></use></svg>
                    </button>
                `);

                // Hover effect
                $deleteBtn.on('mouseenter', function() {
                    $(this).css('color', 'var(--red-500)');
                });
                $deleteBtn.on('mouseleave', function() {
                    $(this).css('color', 'var(--text-muted)');
                });

                $deleteBtn.on('click', function(e) {
                    e.stopPropagation();

                    const deleteRow = function() {
                        // Delete the row
                        me.remove();

                        // Refresh the add button to show Save button if needed
                        setTimeout(function() {
                            if (me.grid && me.grid.setup_add_button) {
                                me.grid.setup_add_button();
                            }
                        }, 100);
                    };

                    // Check if confirmation is enabled
                    if (config.confirm_delete) {
                        frappe.warn(
                            __('Are you sure you want to delete this row?'),
                            __('This action cannot be undone until you save the form.'),
                            deleteRow,
                            __('Delete'),
                            false  // is_minimizable
                        );
                    } else {
                        // Delete immediately without confirmation
                        deleteRow();
                    }
                });

                $lastCol.append($deleteBtn);
            }
        }
    };

    /**
     * Add quick action buttons to row
     */
    GridRowClass.prototype.add_row_actions = function(config) {
        if (!config.show_row_actions) return;

        // Skip if this is a header row (no doc)
        if (!this.doc) return;

        const me = this;
        
        // Create actions container
        const $actions = $('<div class="grid-row-actions" style="display: none; position: absolute; right: 10px; top: 50%; transform: translateY(-50%);"></div>');

        // Add duplicate button
        const $duplicate_btn = $('<button class="btn btn-xs btn-secondary" title="' + __('Duplicate') + '">')
            .html('<i class="fa fa-copy"></i>')
            .on('click', function(e) {
                e.stopPropagation();
                me.duplicate_row();
            });

        // Add insert above button
        const $insert_above_btn = $('<button class="btn btn-xs btn-secondary" title="' + __('Insert Above') + '">')
            .html('<i class="fa fa-arrow-up"></i>')
            .on('click', function(e) {
                e.stopPropagation();
                me.insert_row_above();
            });

        // Add insert below button
        const $insert_below_btn = $('<button class="btn btn-xs btn-secondary" title="' + __('Insert Below') + '">')
            .html('<i class="fa fa-arrow-down"></i>')
            .on('click', function(e) {
                e.stopPropagation();
                me.insert_row_below();
            });

        $actions.append($duplicate_btn, $insert_above_btn, $insert_below_btn);
        this.row.css('position', 'relative').append($actions);

        // Show actions on hover
        this.row.on('mouseenter', function() {
            $actions.show();
        });

        this.row.on('mouseleave', function() {
            $actions.hide();
        });
    };

    /**
     * Duplicate current row
     */
    GridRowClass.prototype.duplicate_row = function() {
        const new_row = this.grid.add_new_row(this.doc.idx);
        
        // Copy all field values except name and idx
        const meta = frappe.get_meta(this.doc.doctype);
        meta.fields.forEach(field => {
            if (field.fieldname !== 'name' && field.fieldname !== 'idx') {
                frappe.model.set_value(
                    new_row.doctype,
                    new_row.name,
                    field.fieldname,
                    this.doc[field.fieldname]
                );
            }
        });

        this.grid.refresh();
        frappe.show_alert({
            message: __('Row duplicated'),
            indicator: 'green'
        });
    };

    /**
     * Insert row above current row
     */
    GridRowClass.prototype.insert_row_above = function() {
        const new_row = this.grid.add_new_row(this.doc.idx);
        this.grid.refresh();
        
        // Scroll to new row
        if (new_row && new_row.toggle_view) {
            new_row.toggle_view(true);
        }
    };

    /**
     * Insert row below current row
     */
    GridRowClass.prototype.insert_row_below = function() {
        const new_row = this.grid.add_new_row(this.doc.idx + 1);
        this.grid.refresh();
        
        // Scroll to new row
        if (new_row && new_row.toggle_view) {
            new_row.toggle_view(true);
        }
    };

        // Mark as initialized
        GridRowClass.prototype._enhanced_grid_row_initialized = true;

        console.log('Enhanced Grid Row loaded successfully');
    }
})();

