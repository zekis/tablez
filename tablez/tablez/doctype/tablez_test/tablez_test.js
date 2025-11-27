// Copyright (c) 2025, Tablez and contributors
// For license information, please see license.txt

frappe.ui.form.on('Tablez Test', {
	refresh: function(frm) {
		// Add buttons to toolbar
		if (!frm.is_new()) {
			frm.add_custom_button(__('Configure Grid'), function() {
				show_tablez_configurator(frm);
			});

			frm.add_custom_button(__('Copy Config Code'), function() {
				show_config_code_dialog(frm);
			});

			frm.add_custom_button(__('Edit Custom Dialog'), function() {
				show_custom_dialog_editor(frm);
			});
		}

		// Apply default Tablez configuration
		apply_tablez_config(frm);
	}
});

frappe.ui.form.on('Tablez Test Item', {
	item_name: function(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		if (row.item_name) {
			// Fetch product details
			frappe.db.get_doc('Tablez Product', row.item_name).then(product => {
				frappe.model.set_value(cdt, cdn, 'item_code', product.product_code);
				frappe.model.set_value(cdt, cdn, 'category', product.category);
				frappe.model.set_value(cdt, cdn, 'rate', product.default_rate);
				frappe.model.set_value(cdt, cdn, 'description', product.description);
			});
		}
	},

	quantity: function(frm, cdt, cdn) {
		calculate_amount(frm, cdt, cdn);
	},

	rate: function(frm, cdt, cdn) {
		calculate_amount(frm, cdt, cdn);
	}
});

function calculate_amount(frm, cdt, cdn) {
	let row = locals[cdt][cdn];
	if (row.quantity && row.rate) {
		row.amount = row.quantity * row.rate;
		frm.refresh_field('items');
	}
}

function apply_tablez_config(frm, retry_count = 0) {
	// Get the items grid (ONLY this grid gets Tablez enhancements)
	// The test_notes grid remains vanilla Frappe for comparison
	let grid = frm.fields_dict.items.grid;

	// Check if Tablez is loaded
	if (!grid.configure_enhanced_grid) {
		// Tablez not loaded yet, wait and retry
		if (retry_count < 10) {
			setTimeout(function() {
				apply_tablez_config(frm, retry_count + 1);
			}, 100);
		} else {
			console.error('Tablez grid enhancements not loaded after 1 second');
		}
		return;
	}

	// Get saved config from localStorage or use defaults
	let config = get_saved_config();

	// Apply the configuration to items grid only
	// test_notes grid will remain vanilla Frappe
	grid.configure_enhanced_grid(config);
}

function get_saved_config() {
	// Default configuration
	const defaults = {
		enabled: true,
		primary_link_field: 'item_name',
		show_add_button: true,
		add_button_label: 'Add Item',
		add_button_action: 'custom',  // Use custom dialog
		custom_add_dialog: null,  // Will be set below from code editor or default
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
		show_total_row: true,
		total_row_config: {
			label: 'Total',
			columns: {
				quantity: 'sum',
				amount: 'sum'
			},
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
		hide_add_row_button: true,
		custom_css: null
	};

	// Try to get saved config from localStorage
	let saved = localStorage.getItem('tablez_test_config');
	let config = defaults;

	if (saved) {
		try {
			const parsed = JSON.parse(saved);
			// Merge saved config with defaults
			config = Object.assign({}, defaults, parsed);
		} catch (e) {
			console.error('Failed to parse saved config:', e);
		}
	}

	// Always get the custom dialog function from code editor (or use default)
	config.custom_add_dialog = get_custom_dialog_function();

	return config;
}

/**
 * Custom dialog to create a new Tablez Product and return its name
 * This demonstrates the custom_add_dialog feature
 * @param {Object} grid - The grid instance
 * @returns {Promise<string|object>} - Returns product name or object with row values
 */
function create_product_dialog(grid) {
	return new Promise((resolve, reject) => {
		const d = new frappe.ui.Dialog({
			title: __('Create New Product'),
			fields: [
				{
					fieldtype: 'Data',
					fieldname: 'product_name',
					label: __('Product Name'),
					reqd: 1
				},
				{
					fieldtype: 'Data',
					fieldname: 'product_code',
					label: __('Product Code')
				},
				{
					fieldtype: 'Column Break'
				},
				{
					fieldtype: 'Select',
					fieldname: 'category',
					label: __('Category'),
					options: 'Electronics\nFurniture\nClothing\nFood\nOther',
					default: 'Other'
				},
				{
					fieldtype: 'Currency',
					fieldname: 'default_rate',
					label: __('Default Rate'),
					default: 0
				},
				{
					fieldtype: 'Section Break',
					label: __('Row Defaults')
				},
				{
					fieldtype: 'Float',
					fieldname: 'quantity',
					label: __('Quantity'),
					default: 1
				}
			],
			primary_action_label: __('Create & Add'),
			primary_action: function(values) {
				// Disable button while processing
				d.disable_primary_action();

				// Create the product in the backend
				frappe.call({
					method: 'frappe.client.insert',
					args: {
						doc: {
							doctype: 'Tablez Product',
							product_name: values.product_name,
							product_code: values.product_code,
							category: values.category,
							default_rate: values.default_rate,
							is_active: 1
						}
					},
					callback: function(r) {
						if (r.exc) {
							d.enable_primary_action();
							// Error is already shown by Frappe
							return;
						}

						const product = r.message;
						frappe.show_alert({
							message: __('Product {0} created successfully', [product.name]),
							indicator: 'green'
						});

						d.hide();

						// Return an object with all the values to set on the new row
						// This includes both the linked field and additional values
						resolve({
							item_name: product.name,
							item_code: product.product_code || '',
							category: product.category || '',
							rate: product.default_rate || 0,
							quantity: values.quantity || 1
						});
					},
					error: function() {
						d.enable_primary_action();
					}
				});
			},
			secondary_action_label: __('Cancel'),
			secondary_action: function() {
				d.hide();
				reject('cancelled');
			}
		});

		d.show();
	});
}

function save_config(config) {
	localStorage.setItem('tablez_test_config', JSON.stringify(config));
}

function get_custom_dialog_code() {
	// Try to get custom code from localStorage
	let saved = localStorage.getItem('tablez_test_custom_dialog_code');
	if (saved) {
		return saved;
	}
	// Return the default function as a string
	return get_default_dialog_code();
}

function save_custom_dialog_code(code) {
	localStorage.setItem('tablez_test_custom_dialog_code', code);
}

function get_default_dialog_code() {
	return `/**
 * Custom dialog to create a new Tablez Product and return its name
 * @param {Object} grid - The grid instance
 * @returns {Promise<string|object>} - Returns product name or object with row values
 */
function(grid) {
    return new Promise((resolve, reject) => {
        const d = new frappe.ui.Dialog({
            title: __('Create New Product'),
            fields: [
                {
                    fieldtype: 'Data',
                    fieldname: 'product_name',
                    label: __('Product Name'),
                    reqd: 1
                },
                {
                    fieldtype: 'Data',
                    fieldname: 'product_code',
                    label: __('Product Code')
                },
                {
                    fieldtype: 'Column Break'
                },
                {
                    fieldtype: 'Select',
                    fieldname: 'category',
                    label: __('Category'),
                    options: 'Electronics\\nFurniture\\nClothing\\nFood\\nOther',
                    default: 'Other'
                },
                {
                    fieldtype: 'Currency',
                    fieldname: 'default_rate',
                    label: __('Default Rate'),
                    default: 0
                },
                {
                    fieldtype: 'Section Break',
                    label: __('Row Defaults')
                },
                {
                    fieldtype: 'Float',
                    fieldname: 'quantity',
                    label: __('Quantity'),
                    default: 1
                }
            ],
            primary_action_label: __('Create & Add'),
            primary_action: function(values) {
                d.disable_primary_action();

                frappe.call({
                    method: 'frappe.client.insert',
                    args: {
                        doc: {
                            doctype: 'Tablez Product',
                            product_name: values.product_name,
                            product_code: values.product_code,
                            category: values.category,
                            default_rate: values.default_rate,
                            is_active: 1
                        }
                    },
                    callback: function(r) {
                        if (r.exc) {
                            d.enable_primary_action();
                            return;
                        }

                        const product = r.message;
                        frappe.show_alert({
                            message: __('Product {0} created', [product.name]),
                            indicator: 'green'
                        });

                        d.hide();

                        // Return values to set on the new row
                        resolve({
                            item_name: product.name,
                            item_code: product.product_code || '',
                            category: product.category || '',
                            rate: product.default_rate || 0,
                            quantity: values.quantity || 1
                        });
                    },
                    error: function() {
                        d.enable_primary_action();
                    }
                });
            },
            secondary_action_label: __('Cancel'),
            secondary_action: function() {
                d.hide();
                reject('cancelled');
            }
        });

        d.show();
    });
}`;
}

function get_custom_dialog_function() {
	// Get the custom code and evaluate it to a function
	const code = get_custom_dialog_code();
	try {
		// Wrap in parentheses to make it an expression and evaluate
		const fn = eval('(' + code + ')');
		if (typeof fn === 'function') {
			return fn;
		}
	} catch (e) {
		console.error('Failed to evaluate custom dialog code:', e);
		frappe.msgprint({
			title: __('Custom Dialog Error'),
			message: __('Failed to parse custom dialog code: {0}', [e.message]),
			indicator: 'red'
		});
	}
	// Fallback to default
	return create_product_dialog;
}

function show_custom_dialog_editor(frm) {
	const current_code = get_custom_dialog_code();

	const d = new frappe.ui.Dialog({
		title: __('Edit Custom Add Dialog'),
		size: 'extra-large',
		fields: [
			{
				fieldtype: 'HTML',
				fieldname: 'instructions',
				options: `
					<div style="margin-bottom: 15px; padding: 10px; background: #e8f4fd; border-radius: 4px; border-left: 4px solid #318AD8;">
						<p style="margin: 0 0 8px 0;"><strong>Custom Add Dialog Function</strong></p>
						<p style="margin: 0; font-size: 12px; color: #666;">
							This function is called when the Add button is clicked (with <code>add_button_action: 'custom'</code>).<br>
							It receives the <code>grid</code> object and should return a <strong>Promise</strong> that resolves with:<br>
							• A <strong>string</strong> (the linked doc name) - sets the primary_link_field<br>
							• An <strong>object</strong> with field values - sets multiple fields on the new row<br>
							• Reject with <code>'cancelled'</code> if user cancels
						</p>
					</div>
				`
			},
			{
				fieldtype: 'Code',
				fieldname: 'dialog_code',
				label: __('Dialog Function Code'),
				options: 'JavaScript',
				default: current_code
			},
			{
				fieldtype: 'Section Break'
			},
			{
				fieldtype: 'Button',
				fieldname: 'test_btn',
				label: __('Test Dialog'),
				click: function() {
					const code = d.get_value('dialog_code');
					try {
						const fn = eval('(' + code + ')');
						if (typeof fn !== 'function') {
							frappe.msgprint(__('Code must be a function'));
							return;
						}
						// Test by calling the function
						const grid = frm.fields_dict.items.grid;
						frappe.show_alert({ message: __('Opening test dialog...'), indicator: 'blue' });

						Promise.resolve(fn.call(grid, grid)).then(function(result) {
							frappe.msgprint({
								title: __('Test Result'),
								message: __('Dialog returned: {0}', [JSON.stringify(result, null, 2)]),
								indicator: 'green'
							});
						}).catch(function(err) {
							if (err !== 'cancelled') {
								frappe.msgprint({
									title: __('Test Error'),
									message: String(err),
									indicator: 'red'
								});
							}
						});
					} catch (e) {
						frappe.msgprint({
							title: __('Syntax Error'),
							message: e.message,
							indicator: 'red'
						});
					}
				}
			},
			{
				fieldtype: 'Button',
				fieldname: 'reset_btn',
				label: __('Reset to Default'),
				click: function() {
					d.set_value('dialog_code', get_default_dialog_code());
				}
			}
		],
		primary_action_label: __('Save'),
		primary_action: function() {
			const code = d.get_value('dialog_code');

			// Validate the code
			try {
				const fn = eval('(' + code + ')');
				if (typeof fn !== 'function') {
					frappe.msgprint(__('Code must be a function'));
					return;
				}
			} catch (e) {
				frappe.msgprint({
					title: __('Syntax Error'),
					message: e.message,
					indicator: 'red'
				});
				return;
			}

			// Save the code
			save_custom_dialog_code(code);

			// Re-apply config to use the new function
			apply_tablez_config(frm);

			frappe.show_alert({
				message: __('Custom dialog saved and applied'),
				indicator: 'green'
			});

			d.hide();
		}
	});

	d.show();

	// Make the code editor taller
	setTimeout(() => {
		const $code = d.$wrapper.find('[data-fieldname="dialog_code"] .ace_editor');
		if ($code.length) {
			$code.css('height', '400px');
			if (d.fields_dict.dialog_code.editor) {
				d.fields_dict.dialog_code.editor.resize();
			}
		}
	}, 100);
}

function show_tablez_configurator(frm) {
	let current_config = get_saved_config();

	let d = new frappe.ui.Dialog({
		title: __('Tablez Grid Configuration'),
		fields: [
			{
				fieldtype: 'Section Break',
				label: 'Basic Settings'
			},
			{
				fieldname: 'enabled',
				fieldtype: 'Check',
				label: 'Enable Tablez',
				default: current_config.enabled
			},
			{
				fieldname: 'primary_link_field',
				fieldtype: 'Data',
				label: 'Primary Link Field',
				default: current_config.primary_link_field,
				description: 'Field to use as primary link (e.g., item_name)'
			},
			{
				fieldtype: 'Column Break'
			},
			{
				fieldname: 'show_save_button',
				fieldtype: 'Check',
				label: 'Show Save Button',
				default: current_config.show_save_button
			},
			{
				fieldname: 'confirm_delete',
				fieldtype: 'Check',
				label: 'Confirm Delete',
				default: current_config.confirm_delete
			},
			{
				fieldtype: 'Section Break',
				label: 'Add Button Settings'
			},
			{
				fieldname: 'show_add_button',
				fieldtype: 'Check',
				label: 'Show Add Button',
				default: current_config.show_add_button
			},
			{
				fieldname: 'add_button_label',
				fieldtype: 'Data',
				label: 'Add Button Label',
				default: current_config.add_button_label,
				depends_on: 'eval:doc.show_add_button'
			},
			{
				fieldname: 'add_button_action',
				fieldtype: 'Select',
				label: 'Add Button Action',
				options: 'inline\ndialog\nlink\ncustom',
				default: current_config.add_button_action,
				depends_on: 'eval:doc.show_add_button',
				description: 'custom: Uses custom_add_dialog function to create linked doc first'
			},
			{
				fieldtype: 'Column Break'
			},
			{
				fieldname: 'show_add_dialog',
				fieldtype: 'Check',
				label: 'Show Add Dialog',
				default: current_config.show_add_dialog
			},
			{
				fieldname: 'hide_add_row_button',
				fieldtype: 'Check',
				label: 'Hide Default Add Row Button',
				default: current_config.hide_add_row_button
			},
			{
				fieldtype: 'Section Break',
				label: 'Row Features'
			},
			{
				fieldname: 'enable_sorting',
				fieldtype: 'Check',
				label: 'Enable Sorting',
				default: current_config.enable_sorting
			},
			{
				fieldname: 'enable_grouping',
				fieldtype: 'Check',
				label: 'Enable Grouping',
				default: current_config.enable_grouping
			},
			{
				fieldname: 'allow_row_reorder',
				fieldtype: 'Check',
				label: 'Allow Row Reorder',
				default: current_config.allow_row_reorder
			},
			{
				fieldtype: 'Column Break'
			},
			{
				fieldname: 'show_row_actions',
				fieldtype: 'Check',
				label: 'Show Row Actions',
				default: current_config.show_row_actions
			},
			{
				fieldname: 'show_edit_button',
				fieldtype: 'Check',
				label: 'Show Edit Button',
				default: current_config.show_edit_button
			},
			{
				fieldname: 'show_delete_button',
				fieldtype: 'Check',
				label: 'Show Delete Button',
				default: current_config.show_delete_button
			},
			{
				fieldtype: 'Section Break',
				label: 'Row Click Settings'
			},
			{
				fieldname: 'enable_row_click',
				fieldtype: 'Check',
				label: 'Enable Row Click',
				default: current_config.enable_row_click
			},
			{
				fieldname: 'row_click_action',
				fieldtype: 'Select',
				label: 'Row Click Action',
				options: 'open_document\nopen_editor\ncustom',
				default: current_config.row_click_action,
				depends_on: 'eval:doc.enable_row_click'
			},
			{
				fieldtype: 'Column Break'
			},
			{
				fieldname: 'enhanced_link_clicks',
				fieldtype: 'Check',
				label: 'Enhanced Link Clicks',
				default: current_config.enhanced_link_clicks
			},
			{
				fieldname: 'row_shift_click_action',
				fieldtype: 'Select',
				label: 'Row Shift+Click Action',
				options: 'open_document\nopen_editor\ncustom',
				default: current_config.row_shift_click_action,
				depends_on: 'eval:doc.enable_row_click'
			},
			{
				fieldtype: 'Section Break',
				label: 'Total Row Settings'
			},
			{
				fieldname: 'show_total_row',
				fieldtype: 'Check',
				label: 'Show Total Row',
				default: current_config.show_total_row
			},
			{
				fieldtype: 'Section Break',
				label: 'Display Settings'
			},
			{
				fieldname: 'hide_row_numbers',
				fieldtype: 'Check',
				label: 'Hide Row Numbers',
				default: current_config.hide_row_numbers
			},
			{
				fieldname: 'hide_checkboxes',
				fieldtype: 'Check',
				label: 'Hide Checkboxes',
				default: current_config.hide_checkboxes
			},
			{
				fieldname: 'hide_edit_icon',
				fieldtype: 'Check',
				label: 'Hide Edit Icon',
				default: current_config.hide_edit_icon
			},
			{
				fieldtype: 'Column Break'
			},
			{
				fieldname: 'auto_column_width',
				fieldtype: 'Check',
				label: 'Auto Column Width',
				default: current_config.auto_column_width,
				description: 'Automatically distribute column widths evenly'
			},
			{
				fieldname: 'actions_column_width',
				fieldtype: 'Data',
				label: 'Actions Column Width',
				default: current_config.actions_column_width,
				description: 'CSS width value (e.g., 120px) or "auto" to calculate based on enabled buttons'
			}
		],
		primary_action_label: __('Apply'),
		primary_action: function(values) {
			// Merge with total_row_config
			let new_config = Object.assign({}, current_config, values);

			// Save the configuration
			save_config(new_config);

			// Apply the configuration
			let grid = frm.fields_dict.items.grid;
			grid.configure_enhanced_grid(new_config);

			frappe.show_alert({
				message: __('Configuration applied successfully'),
				indicator: 'green'
			});

			d.hide();
		}
	});

	d.show();
}

function show_config_code_dialog(frm) {
	// Get current config from the configurator
	const config = get_saved_config();

	// Create dialog to collect target DocType and table options
	const d = new frappe.ui.Dialog({
		title: __('Generate Configuration Code'),
		size: 'large',
		fields: [
			{
				fieldtype: 'HTML',
				fieldname: 'instructions',
				options: `
					<div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
						<p style="margin: 0; color: #666;">
							<strong>Copy this code to your DocType's Client Script</strong><br>
							1. Enter your actual DocType (form) name.<br>
							2. Choose whether to configure all child tables or only specific ones.<br>
							3. Click <em>Generate &amp; Copy</em>, then paste into your Client Script.
						</p>
					</div>
				`
			},
			{
				fieldtype: 'Data',
				fieldname: 'target_doctype',
				label: __('Form / DocType name'),
				reqd: 1,
				default: frm.doctype || ''
			},
			{
				fieldtype: 'Check',
				fieldname: 'apply_to_all_tables',
				label: __('Apply to all child tables on this form')
			},
			{
				fieldtype: 'Data',
				fieldname: 'table_fields',
				label: __('Specific table fieldnames (comma-separated)'),
				description: __('Leave blank if using "all tables". Example: items, packed_items')
			},
			{
				fieldtype: 'Code',
				fieldname: 'config_code',
				label: __('Configuration Code'),
				options: 'JavaScript',
				read_only: 1
			}
		],
		primary_action_label: __('Generate & Copy'),
		primary_action: function() {
			const values = d.get_values();

			const options = {
				 target_doctype: values.target_doctype,
				 apply_to_all_tables: !!values.apply_to_all_tables,
				 table_fields: values.table_fields
			};

			// Generate the JavaScript code based on user input
			const code = generate_config_code_advanced(config, options);

			// Show the generated code in the dialog
			d.set_value('config_code', code);

			// Helper for older browsers
			const fallback_copy = function() {
				const textarea = document.createElement('textarea');
				textarea.value = code;
				textarea.style.position = 'fixed';
				textarea.style.opacity = '0';
				document.body.appendChild(textarea);
				textarea.select();
				try {
					document.execCommand('copy');
					frappe.show_alert({
						message: __('Configuration code generated and copied to clipboard!'),
						indicator: 'green'
					});
					d.hide();
				} catch (e) {
					frappe.msgprint(__('Failed to copy to clipboard. Please copy manually.'));
				}
				document.body.removeChild(textarea);
			};

			// Copy to clipboard (modern API with fallback)
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(code).then(function() {
					frappe.show_alert({
						message: __('Configuration code generated and copied to clipboard!'),
						indicator: 'green'
					});
					d.hide();
				}).catch(function() {
					fallback_copy();
				});
			} else {
				fallback_copy();
			}
		}
	});

	d.show();
}

function generate_config_code(config) {
	// Helper to format value for JavaScript
	function formatValue(value, indent = '') {
		if (value === null || value === undefined) {
			return 'null';
		}
		if (typeof value === 'string') {
			return `'${value}'`;
		}
		if (typeof value === 'boolean' || typeof value === 'number') {
			return String(value);
		}
		if (typeof value === 'object' && !Array.isArray(value)) {
			const entries = Object.entries(value);
			if (entries.length === 0) return '{}';

			const innerIndent = indent + '\t\t';
			const lines = entries.map(([key, val]) => {
				return `${innerIndent}'${key}': ${formatValue(val, innerIndent)}`;
			});
			return '{\n' + lines.join(',\n') + '\n' + indent + '\t}';
		}
		return JSON.stringify(value);
	}

	// Generate the code
	let code = `// Tablez Configuration
// Generated from Tablez Test configurator

frappe.ui.form.on('Your DocType', {
\trefresh: function(frm) {
\t\t// Configure your child table
\t\tif (frm.fields_dict.your_child_table && frm.fields_dict.your_child_table.grid) {
\t\t\tconst grid = frm.fields_dict.your_child_table.grid;
\t\t\t
\t\t\t// Using the recommended helper function (handles async loading)
\t\t\ttablez.configure_grid(grid, {
`;

	// Add each config option
	const configEntries = Object.entries(config);
	configEntries.forEach(([key, value], index) => {
		const isLast = index === configEntries.length - 1;
		const comma = isLast ? '' : ',';

		// Add comment for major sections
		if (key === 'enabled') {
			code += `\t\t\t\t// Basic Settings\n`;
		} else if (key === 'show_add_button') {
			code += `\t\t\t\t\n\t\t\t\t// Add Button Settings\n`;
		} else if (key === 'enable_sorting') {
			code += `\t\t\t\t\n\t\t\t\t// Row Features\n`;
		} else if (key === 'show_edit_button') {
			code += `\t\t\t\t\n\t\t\t\t// Row Action Buttons\n`;
		} else if (key === 'enable_row_click') {
			code += `\t\t\t\t\n\t\t\t\t// Row Click Settings\n`;
		} else if (key === 'show_total_row') {
			code += `\t\t\t\t\n\t\t\t\t// Total Row Settings\n`;
		} else if (key === 'column_widths') {
			code += `\t\t\t\t\n\t\t\t\t// Column Width Settings\n`;
		} else if (key === 'hide_row_numbers') {
			code += `\t\t\t\t\n\t\t\t\t// Display Settings\n`;
		} else if (key === 'custom_css') {
			code += `\t\t\t\t\n\t\t\t\t// Custom CSS\n`;
		}

		code += `\t\t\t\t${key}: ${formatValue(value, '\t\t\t\t')}${comma}\n`;
	});

	code += `\t\t\t});
\t\t}
\t}
});`;

	return code;
}

function generate_config_code_advanced(config, options = {}) {
	// Coerce options from argument for safety
	options = options || {};

	// Helper to format value for JavaScript
	function formatValue(value, indent = '') {
		if (value === null || value === undefined) {
			return 'null';
		}
		if (typeof value === 'string') {
			return `'${value}'`;
		}
		if (typeof value === 'boolean' || typeof value === 'number') {
			return String(value);
		}
		if (typeof value === 'object' && !Array.isArray(value)) {
			const entries = Object.entries(value);
			if (entries.length === 0) return '{}';

			const innerIndent = indent + '\t\t';
			const lines = entries.map(([key, val]) => {
				return `${innerIndent}'${key}': ${formatValue(val, innerIndent)}`;
			});
			return '{\n' + lines.join(',\n') + '\n' + indent + '\t}';
		}
		return JSON.stringify(value);
	}

	// Get the custom dialog code if using custom action
	const customDialogCode = config.add_button_action === 'custom' ? get_custom_dialog_code() : null;

	// Build the config object body (with comments) at a given indent level
	function buildConfigBody(indent) {
		const configEntries = Object.entries(config || {});
		let body = '';

		configEntries.forEach(([key, value], index) => {
			const isLast = index === configEntries.length - 1;
			const comma = isLast ? '' : ',';

			// Skip custom_add_dialog - we reference the separate function by name
			if (key === 'custom_add_dialog') {
				if (customDialogCode && config.add_button_action === 'custom') {
					body += `${indent}\n${indent}// Reference to custom dialog function defined above\n`;
					body += `${indent}custom_add_dialog: custom_add_dialog${comma}\n`;
				}
				return;
			}

			// Add comment for major sections
			if (key === 'enabled') {
				body += `${indent}// Basic Settings\n`;
			} else if (key === 'show_add_button') {
				body += `${indent}\n${indent}// Add Button Settings\n`;
			} else if (key === 'enable_sorting') {
				body += `${indent}\n${indent}// Row Features\n`;
			} else if (key === 'show_edit_button') {
				body += `${indent}\n${indent}// Row Action Buttons\n`;
			} else if (key === 'enable_row_click') {
				body += `${indent}\n${indent}// Row Click Settings\n`;
			} else if (key === 'show_total_row') {
				body += `${indent}\n${indent}// Total Row Settings\n`;
			} else if (key === 'column_widths') {
				body += `${indent}\n${indent}// Column Width Settings\n`;
			} else if (key === 'hide_row_numbers') {
				body += `${indent}\n${indent}// Display Settings\n`;
			} else if (key === 'custom_css') {
				body += `${indent}\n${indent}// Custom CSS\n`;
			}

			body += `${indent}${key}: ${formatValue(value, indent)}${comma}\n`;
		});

		return body;
	}

	// Build the custom dialog function as a separate named function
	function buildCustomDialogFunction() {
		if (!customDialogCode || config.add_button_action !== 'custom') {
			return '';
		}

		// Convert the anonymous function to a named function
		// The stored code starts with "function(grid)" - we need to make it "function custom_add_dialog(grid)"
		let fnCode = customDialogCode.trim();

		// Replace "function(" or "function (" with "function custom_add_dialog("
		if (fnCode.startsWith('function(') || fnCode.startsWith('function (')) {
			fnCode = fnCode.replace(/^function\s*\(/, 'function custom_add_dialog(');
		} else if (fnCode.startsWith('(grid)') || fnCode.startsWith('(grid) =>') || fnCode.startsWith('grid =>')) {
			// Arrow function - wrap it
			fnCode = `function custom_add_dialog(grid) {\n\treturn (${fnCode})(grid);\n}`;
		}

		return `/**
 * Custom Add Dialog Function
 * Called when add button is clicked with add_button_action: 'custom'
 * @param {Object} grid - The grid instance
 * @returns {Promise<string|object>} - Returns linked doc name or object with field values
 */
${fnCode}

`;
	}

	// Normalize options
	const targetDoctype = options.target_doctype || 'Your DocType';
	const applyToAllTables = !!options.apply_to_all_tables;

	let tableFields = [];
	if (!applyToAllTables) {
		if (Array.isArray(options.table_fields)) {
			tableFields = options.table_fields;
		} else if (typeof options.table_fields === 'string') {
			tableFields = options.table_fields
				.split(',')
				.map(f => f.trim())
				.filter(Boolean);
		}
	}

	// Start building the code
	let code = `// Tablez Configuration
// Generated from Tablez Test configurator

`;

	// Add the custom dialog function as a separate named function (if using custom action)
	code += buildCustomDialogFunction();

	code += `frappe.ui.form.on('${targetDoctype}', {
	refresh: function(frm) {
`;

	if (applyToAllTables) {
		// Configure all child tables on the form
		code += `		// Configure all child tables on this form\n`;
		code += `		Object.keys(frm.fields_dict).forEach(function(fieldname) {\n`;
		code += `			const field = frm.fields_dict[fieldname];\n`;
		code += `			if (field.df.fieldtype === 'Table' && field.grid) {\n`;
		code += `				const grid = field.grid;\n`;
		code += `				// Using the recommended helper function (handles async loading)\n`;
		code += `				tablez.configure_grid(grid, {\n`;
		code += buildConfigBody('					');
		code += `				});\n`;
		code += `			}\n`;
		code += `		});\n`;
	} else if (tableFields.length > 0) {
		// Configure only specific child tables
		code += `		// Configure specific child tables on this form\n`;
		code += `		const table_fields = ${JSON.stringify(tableFields)};\n`;
		code += `		(table_fields || []).forEach(function(fieldname) {\n`;
		code += `			if (frm.fields_dict[fieldname] && frm.fields_dict[fieldname].grid) {\n`;
		code += `				const grid = frm.fields_dict[fieldname].grid;\n`;
		code += `				// Using the recommended helper function (handles async loading)\n`;
		code += `				tablez.configure_grid(grid, {\n`;
		code += buildConfigBody('					');
		code += `				});\n`;
		code += `			}\n`;
		code += `		});\n`;
	} else {
		// Fallback: single child table placeholder
		code += `		// Configure your child table\n`;
		code += `		if (frm.fields_dict.your_child_table && frm.fields_dict.your_child_table.grid) {\n`;
		code += `			const grid = frm.fields_dict.your_child_table.grid;\n`;
		code += `			// Using the recommended helper function (handles async loading)\n`;
		code += `			tablez.configure_grid(grid, {\n`;
		code += buildConfigBody('				');
		code += `			});\n`;
		code += `		}\n`;
	}

	code += `	}
});`;

	return code;
}


