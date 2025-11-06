# Tablez - Enhanced Child Tables for Frappe

A Frappe app that replaces default child tables (Grid) with an enhanced version providing better UX and more flexibility.

![Frappe Version](https://img.shields.io/badge/Frappe-v14%20%7C%20v15-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Problem Statement

Frappe's default child tables have several UX limitations:

1. **❌ Row Edit Button**: Opens the child table row editor instead of the referenced document
2. **❌ Add Row**: Always adds to the bottom without dialog/customization options
3. **❌ Link Fields**: Require clicking tiny arrows to open linked documents (not intuitive)
4. **❌ Limited Features**: No built-in support for grouping, sorting, or advanced table operations

## ✨ Features

### 🎯 Smart Row Click
- Click anywhere on a row to open the primary linked document
- **Shift+Click** to open row editor (for power users)
- **Ctrl+Click** to open in new tab
- Auto-detects the primary link field

### 🔗 Enhanced Link Fields
- Entire cell is clickable (not just tiny arrow)
- Visual indicator on hover
- Better accessibility for new users

### 📊 Sorting & Grouping
- Click column headers to sort
- Multi-column sorting (Shift+Click)
- Group by any field
- Collapsible groups

### ➕ Better Add Row
- Optional dialog before adding row
- Pre-fill fields based on context
- Insert row at specific position
- Duplicate row functionality

### ⚡ Quick Actions
- Hover over rows to see action buttons
- Duplicate, insert above/below
- Bulk operations (delete, duplicate, export)

## 🚀 Quick Start

### Installation

```bash
# Get the app
cd ~/frappe-bench
bench get-app https://github.com/yourusername/tablez

# Install on your site
bench --site your-site install-app tablez

# Build assets
bench build --app tablez

# Clear cache and restart
bench clear-cache
bench restart
```

### Basic Usage

Once installed, all child tables are automatically enhanced! No configuration needed for basic improvements.

### Custom Configuration

Configure specific tables for advanced features:

```javascript
// In your custom script
frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
        frm.fields_dict.items.grid.configure_enhanced_grid({
            primary_link_field: 'item_code',  // Click row to open Item
            show_add_dialog: true,             // Show dialog when adding
            enable_sorting: true,              // Enable column sorting
            enable_grouping: true,             // Enable grouping
            group_by_field: 'item_group'       // Group by Item Group
        });
    }
});
```

## 📖 Documentation

- **[Implementation Guide](IMPLEMENTATION_GUIDE.md)** - Technical details and architecture
- **[Usage Examples](USAGE_EXAMPLES.md)** - Real-world examples and configuration
- **[API Reference](#configuration-options)** - All configuration options

## 🎨 Screenshots

### Before (Default Frappe)
- Tiny link arrows
- Row click opens editor
- No sorting/grouping
- Add always at bottom

### After (Tablez)
- Entire cells clickable
- Row click opens linked doc
- Column sorting enabled
- Add with dialog option
- Quick action buttons

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | Boolean | `true` | Enable/disable enhanced grid |
| `primary_link_field` | String | Auto-detect | Field to open when row is clicked |
| `show_add_dialog` | Boolean | `false` | Show dialog when adding rows |
| `enable_sorting` | Boolean | `true` | Enable column sorting |
| `enable_grouping` | Boolean | `false` | Enable row grouping |
| `group_by_field` | String | `null` | Field to group by |
| `enhanced_link_clicks` | Boolean | `true` | Make entire link cell clickable |
| `show_row_actions` | Boolean | `true` | Show action buttons on hover |

## 🎯 Use Cases

### Manufacturing
- BOM items table with grouping by item group
- Click rows to open Item masters
- Sort by quantity or rate

### Sales
- Sales Order items with add dialog
- Quick access to Item and Customer docs
- Bulk operations on selected items

### Projects
- Timesheet activities with project links
- Sort by hours or activity type
- Duplicate common entries

### HR
- Employee training records
- Group by training type
- Quick access to training materials

## 🔧 Advanced Features

### Keyboard Shortcuts
- **Click**: Open primary linked document
- **Shift+Click**: Open row editor
- **Ctrl+Click**: Open in new tab
- **Shift+Click header**: Multi-column sort

### Bulk Operations
1. Click "Bulk Actions" button
2. Select multiple rows
3. Delete, duplicate, or export selected

### Custom Styling
Add your own CSS to customize appearance:

```css
/* Change row hover color */
.grid-row:hover {
    background-color: #e3f2fd !important;
}
```

## 🛠️ Development

### Architecture

- **JavaScript Override**: Extends Frappe's Grid and GridRow classes
- **Non-invasive**: Works alongside Frappe updates
- **Configurable**: Enable/disable per doctype or field
- **Compatible**: Maintains standard Grid API

### File Structure

```
tablez/
├── public/
│   ├── js/
│   │   ├── enhanced_grid.js       # Main grid override
│   │   └── enhanced_grid_row.js   # Row-level enhancements
│   └── css/
│       └── enhanced_grid.css      # Custom styling
├── hooks.py                       # Frappe hooks
└── README.md
```

### Contributing

Contributions welcome! Please:
1. Test thoroughly with different doctypes
2. Maintain backward compatibility
3. Document new features
4. Follow Frappe coding standards

## 🐛 Troubleshooting

### Grid not enhancing?
```bash
bench clear-cache
bench build --app tablez
# Hard refresh browser (Ctrl+Shift+R)
```

### Conflicts with custom scripts?
```javascript
// Disable for specific table
frm.fields_dict.my_table.grid.disable_enhanced_grid();
```

### Performance issues?
- Disable grouping for large tables
- Use Frappe's pagination (default: 50 rows)
- Disable row actions if not needed

## 📋 Requirements

- Frappe Framework v14 or v15
- Modern browser (Chrome, Firefox, Safari, Edge)

## 🗺️ Roadmap

- [ ] Virtual scrolling for large tables (1000+ rows)
- [ ] Inline editing (edit cells without opening row form)
- [ ] Column resizing and reordering
- [ ] Advanced filtering UI
- [ ] Keyboard navigation (arrow keys)
- [ ] Mobile-responsive grid view
- [ ] Excel-like features

## 📄 License

MIT License - see [license.txt](license.txt)

## 🙏 Credits

Developed by **TierneyMorris Pty Ltd**

Built on top of the excellent [Frappe Framework](https://frappeframework.com/)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/tablez/issues)
- **Discussions**: [Frappe Forum](https://discuss.frappe.io/)
- **Email**: support@tierneymorris.com.au

---

**Made with ❤️ for the Frappe community**