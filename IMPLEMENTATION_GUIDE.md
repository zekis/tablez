# Tablez - Custom Child Table Implementation Guide

## Overview
This Frappe app replaces the default child table (Grid) implementation with an enhanced version that provides better UX and more flexibility.

## Problem Statement
Frappe's default child tables have several UX limitations:
1. **Row Edit Button**: Opens the child table row editor instead of the referenced document
2. **Add Row**: Always adds to the bottom without dialog/customization options
3. **Link Fields**: Require clicking tiny arrows to open linked documents (not intuitive)
4. **Limited Features**: No built-in support for grouping, sorting, or advanced table operations

## Implementation Approaches

### Approach 1: JavaScript Override (Recommended ✅)
**Method**: Override Frappe's Grid and GridRow classes using custom JavaScript injected via hooks.

**Pros**:
- Non-invasive, works alongside Frappe updates
- Can be toggled on/off per doctype or field
- Maintains compatibility with existing doctypes
- Easy to maintain and debug

**Cons**:
- Requires understanding of Frappe's internal Grid API
- May need updates when Frappe changes Grid implementation

**Implementation**:
- Create custom `EnhancedGrid` class extending `frappe.ui.form.Grid`
- Override key methods: `add_new_row()`, `setup_visible_columns()`, `render_row()`
- Hook into form rendering via `app_include_js`

### Approach 2: Custom Field Control
**Method**: Create entirely new field control type that replaces "Table" fieldtype.

**Pros**:
- Complete control over rendering and behavior
- Can use modern frameworks (Vue, React) if desired
- Maximum flexibility

**Cons**:
- More complex implementation
- Requires changes to doctypes (change fieldtype)
- Higher maintenance burden
- May break compatibility with standard Frappe features

### Approach 3: CSS-Only Overrides
**Method**: Use CSS to improve UX without changing JavaScript behavior.

**Pros**:
- Simplest implementation
- No JavaScript complexity
- Very stable across Frappe versions

**Cons**:
- Cannot change behavior (only styling)
- Limited to visual improvements
- Cannot solve core UX issues like row edit behavior

## Recommended Strategy: Hybrid Approach

We'll use **Approach 1** as the foundation with CSS enhancements:

1. **JavaScript Overrides** for behavioral changes:
   - Custom row click handlers to open referenced docs
   - Enhanced add row with dialog support
   - Improved link field interactions
   - Sorting and grouping capabilities

2. **CSS Enhancements** for visual improvements:
   - Larger click targets for link fields
   - Better hover states
   - Improved row selection visuals
   - Modern table styling

3. **Configuration System**:
   - Enable/disable per doctype via custom field property
   - Configurable behaviors (e.g., which link field to open on row click)
   - Fallback to standard grid when not configured

## Architecture

### File Structure
```
tablez/
├── public/
│   ├── js/
│   │   ├── enhanced_grid.js          # Main grid override
│   │   ├── enhanced_grid_row.js      # Row-level enhancements
│   │   ├── grid_utils.js             # Utility functions
│   │   └── tablez.bundle.js          # Bundle entry point
│   └── css/
│       └── enhanced_grid.css         # Custom styling
├── hooks.py                          # Frappe hooks configuration
└── tablez/
    └── public/
        └── js/
            └── doctype_handlers/     # Per-doctype customizations
```

### Key Components

#### 1. EnhancedGrid Class
Extends `frappe.ui.form.Grid` with:
- `setup_enhanced_features()`: Initialize custom behaviors
- `add_row_with_dialog()`: Show dialog before adding row
- `setup_sorting()`: Enable column sorting
- `setup_grouping()`: Enable row grouping
- `get_primary_link_field()`: Determine which link to open on row click

#### 2. EnhancedGridRow Class
Extends `frappe.ui.form.GridRow` with:
- `setup_row_click_handler()`: Open referenced doc instead of row editor
- `enhance_link_fields()`: Make entire link field cell clickable
- `add_quick_actions()`: Add action buttons to each row

#### 3. Configuration
Use custom field properties in DocType JSON:
```json
{
  "fieldname": "items",
  "fieldtype": "Table",
  "options": "Item Table",
  "enhanced_grid": 1,
  "primary_link_field": "item_code",
  "show_add_dialog": 1,
  "enable_sorting": 1,
  "enable_grouping": 1
}
```

## Features

### 1. Smart Row Click
- Click anywhere on row to open the primary linked document
- Configurable via `primary_link_field` property
- Fallback to row editor if no link field configured
- Shift+Click for row editor (power users)

### 2. Enhanced Add Row
- Optional dialog before adding row
- Pre-fill fields based on context
- Duplicate row functionality
- Insert row at specific position

### 3. Better Link Fields
- Entire cell is clickable (not just tiny arrow)
- Visual indicator on hover
- Ctrl+Click to open in new tab
- Quick preview on hover (optional)

### 4. Sorting & Grouping
- Click column headers to sort
- Multi-column sorting (Shift+Click)
- Group by any field
- Collapsible groups

### 5. Bulk Operations
- Select multiple rows (checkboxes)
- Bulk edit selected rows
- Bulk delete with confirmation
- Export selected rows

## Usage Examples

### Basic Usage (Auto-enabled)
The enhanced grid automatically activates for all child tables. No configuration needed for basic improvements.

### Custom Configuration
```javascript
// In custom script for Sales Order
frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
        // Configure items table
        frm.fields_dict.items.grid.configure_enhanced_grid({
            primary_link_field: 'item_code',
            show_add_dialog: true,
            enable_sorting: true,
            enable_grouping: true,
            group_by_field: 'item_group'
        });
    }
});
```

### Disable for Specific Doctype
```javascript
frappe.ui.form.on('My DocType', {
    refresh: function(frm) {
        frm.fields_dict.my_table.grid.disable_enhanced_grid();
    }
});
```

## Technical Details

### Hooking Mechanism
1. `app_include_js` in hooks.py loads our JavaScript globally
2. Our code wraps/extends Frappe's Grid classes
3. Original Grid class is preserved as `frappe.ui.form.GridOriginal`
4. Enhanced version becomes the default `frappe.ui.form.Grid`

### Event Handling
- Use event delegation for performance
- Prevent event bubbling conflicts
- Respect Frappe's form dirty state
- Trigger appropriate Frappe events

### Compatibility
- Tested with Frappe v14, v15
- Graceful degradation for unsupported features
- Respects standard Grid API
- Works with custom scripts

## Development Workflow

1. **Install the app** in your Frappe bench
2. **Build assets**: `bench build --app tablez`
3. **Clear cache**: `bench clear-cache`
4. **Test** on a doctype with child tables
5. **Iterate** on features

## Future Enhancements

- [ ] Virtual scrolling for large tables (1000+ rows)
- [ ] Inline editing (edit cells without opening row form)
- [ ] Column resizing and reordering
- [ ] Export to Excel/CSV
- [ ] Advanced filtering UI
- [ ] Keyboard navigation (arrow keys)
- [ ] Undo/redo for grid operations
- [ ] Mobile-responsive grid view
- [ ] Integration with Frappe's new UI (if applicable)

## Troubleshooting

### Grid not enhancing
- Check browser console for errors
- Verify `bench build --app tablez` was run
- Clear cache: `bench clear-cache`
- Check hooks.py configuration

### Conflicts with custom scripts
- Enhanced grid respects custom scripts
- Use `disable_enhanced_grid()` if needed
- Check event handler order

### Performance issues
- Disable grouping for very large tables
- Use pagination (Frappe default: 50 rows)
- Consider virtual scrolling (future feature)

## Contributing

Contributions welcome! Please:
1. Test thoroughly with different doctypes
2. Maintain backward compatibility
3. Document new features
4. Follow Frappe coding standards

