// Copyright (c) 2025, Tablez and contributors
// For license information, please see license.txt

frappe.ui.form.on('Tablez Test', {
	refresh: function(frm) {
		// Add a button to open the Tablez configurator
		if (!frm.is_new()) {
			frm.add_custom_button(__('Configure Grid'), function() {
				show_tablez_configurator(frm);
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
	// Try to get saved config from localStorage
	let saved = localStorage.getItem('tablez_test_config');
	if (saved) {
		try {
			return JSON.parse(saved);
		} catch (e) {
			console.error('Failed to parse saved config:', e);
		}
	}
	
	// Default configuration
	return {
		enabled: true,
		primary_link_field: 'item_name',
		show_add_button: true,
		add_button_label: 'Add Item',
		add_button_action: 'inline',
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
}

function save_config(config) {
	localStorage.setItem('tablez_test_config', JSON.stringify(config));
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
				options: 'inline\ndialog\nlink',
				default: current_config.add_button_action,
				depends_on: 'eval:doc.show_add_button'
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

