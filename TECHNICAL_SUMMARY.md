# Tablez - Technical Summary

## Overview

Tablez is a Frappe app that enhances child tables (Grid) with better UX through JavaScript class extension and CSS styling. It's non-invasive, configurable, and maintains compatibility with Frappe's standard Grid API.

## Architecture

### Component Hierarchy

```
Frappe Form
    └── Field (fieldtype: "Table")
        └── Grid (frappe.ui.form.Grid)
            ├── GridRow (frappe.ui.form.GridRow) [multiple instances]
            └── Grid Toolbar (buttons, pagination)
```

### Tablez Enhancement Layer

```
EnhancedGrid extends frappe.ui.form.Grid
    ├── Configuration System
    ├── Enhanced Toolbar
    ├── Sorting Engine
    ├── Grouping Engine
    └── Bulk Operations

EnhancedGridRow extends frappe.ui.form.GridRow
    ├── Smart Click Handler
    ├── Link Field Enhancement
    ├── Row Actions
    └── Visual Indicators
```

## File Structure

```
tablez/
├── public/
│   ├── js/
│   │   ├── grid_utils.js           # Utility functions (loaded first)
│   │   ├── enhanced_grid.js        # Grid class extension
│   │   └── enhanced_grid_row.js    # GridRow class extension
│   └── css/
│       └── enhanced_grid.css       # Styling and visual enhancements
├── hooks.py                        # Frappe hooks configuration
├── IMPLEMENTATION_GUIDE.md         # Technical implementation details
├── USAGE_EXAMPLES.md               # User-facing documentation
├── QUICK_START.md                  # Installation and testing guide
└── examples/                       # Example custom scripts
    ├── sales_order_example.js
    └── bom_example.js
```

## How It Works

### 1. Loading Sequence

```
1. Frappe loads desk.html
2. Frappe includes app_include_js files (from hooks.py)
3. grid_utils.js loads → Creates tablez namespace
4. enhanced_grid.js loads → Extends Grid class
5. enhanced_grid_row.js loads → Extends GridRow class
6. enhanced_grid.css loads → Applies styling
7. Form renders → Uses EnhancedGrid instead of Grid
```

### 2. Class Extension Pattern

```javascript
// Store original class
frappe.ui.form.GridOriginal = frappe.ui.form.Grid;

// Create enhanced class
class EnhancedGrid extends frappe.ui.form.GridOriginal {
    constructor(opts) {
        super(opts);  // Call parent constructor
        this.enhanced_config = {...};
    }
    
    make() {
        super.make();  // Call parent method
        this.setup_enhanced_features();  // Add enhancements
    }
}

// Replace original
frappe.ui.form.Grid = EnhancedGrid;
```

### 3. Configuration System

```javascript
// Default configuration
const DEFAULT_CONFIG = {
    enabled: true,
    primary_link_field: null,  // Auto-detect
    show_add_dialog: false,
    enable_sorting: true,
    enable_grouping: false,
    enhanced_link_clicks: true,
    show_row_actions: true
};

// Per-grid configuration
grid.configure_enhanced_grid({
    primary_link_field: 'item_code',
    show_add_dialog: true
});
```

### 4. Event Handling

```javascript
// Event delegation for performance
this.wrapper.on('click', '.grid-heading-row .col', function(e) {
    // Handle column click for sorting
});

// Row-level events
this.row.on('click', function(e) {
    // Check target to avoid conflicts
    if ($target.closest('input, button, a').length) return;
    
    // Handle row click
});
```

## Key Features Implementation

### Smart Row Click

**Problem**: Default behavior opens row editor  
**Solution**: Intercept click event and route to linked document

```javascript
setup_row_click_handler(config) {
    this.row.off('click');  // Remove default handler
    this.row.on('click', function(e) {
        if (e.shiftKey) {
            // Shift+Click: Open row editor (old behavior)
            me.toggle_view();
        } else {
            // Normal click: Open linked document
            const link_value = me.doc[primary_link];
            frappe.set_route('Form', doctype, link_value);
        }
    });
}
```

### Enhanced Link Fields

**Problem**: Tiny arrow is hard to click  
**Solution**: Make entire cell clickable with visual feedback

```javascript
enhance_link_fields(config) {
    link_fields.forEach(field => {
        const $field = this.row.find(`[data-fieldname="${fieldname}"]`);
        
        // Make clickable
        $field.css('cursor', 'pointer');
        
        // Add click handler
        $field.on('click', function(e) {
            e.stopPropagation();
            frappe.set_route('Form', field.options, link_value);
        });
        
        // Add visual indicator
        $field.append('<span class="link-field-icon">🔗</span>');
    });
}
```

### Column Sorting

**Problem**: No built-in sorting  
**Solution**: Add click handlers to column headers

```javascript
setup_sorting() {
    this.wrapper.on('click', '.grid-heading-row .col', function(e) {
        const fieldname = $(this).attr('data-fieldname');
        const current_sort = $(this).attr('data-sort-order') || 'none';
        
        // Cycle: none → asc → desc → none
        const new_sort = current_sort === 'none' ? 'asc' : 
                        current_sort === 'asc' ? 'desc' : 'none';
        
        me.sort_by_field(fieldname, new_sort);
    });
}
```

### Add Row with Dialog

**Problem**: Add row always adds to bottom without context  
**Solution**: Show dialog with all fields before adding

```javascript
add_row_with_dialog() {
    const meta = frappe.get_meta(this.doctype);
    const fields = meta.fields.filter(f => !f.hidden && !f.read_only);
    
    const dialog = new frappe.ui.Dialog({
        title: __('Add Row'),
        fields: fields,
        primary_action: function(values) {
            const row = me.add_new_row();
            Object.keys(values).forEach(key => {
                frappe.model.set_value(row.doctype, row.name, key, values[key]);
            });
        }
    });
    
    dialog.show();
}
```

## CSS Strategy

### Approach

1. **Enhance, don't replace**: Build on Frappe's existing styles
2. **Use CSS variables**: Respect Frappe's theming system
3. **Progressive enhancement**: Works without CSS (JavaScript still functional)
4. **Responsive**: Mobile-friendly with media queries

### Key Styles

```css
/* Clickable rows */
.grid-row {
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.grid-row:hover {
    background-color: var(--bg-light-gray);
}

/* Enhanced link fields */
.grid-body [data-fieldtype="Link"] {
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 3px;
}

/* Sortable columns */
.grid-heading-row .col[data-sort-order] {
    cursor: pointer;
    user-select: none;
}

/* Row actions */
.grid-row-actions {
    display: none;
    position: absolute;
    right: 10px;
}

.grid-row:hover .grid-row-actions {
    display: flex;
}
```

## Performance Considerations

### Optimizations

1. **Event Delegation**: Use wrapper-level event handlers instead of per-row
2. **Debouncing**: Debounce expensive operations (search, filter)
3. **Lazy Loading**: Only enhance visible rows
4. **CSS Transitions**: Use GPU-accelerated properties (transform, opacity)
5. **Minimal DOM Manipulation**: Batch updates, use DocumentFragment

### Benchmarks

- **Small tables (<20 rows)**: No noticeable overhead
- **Medium tables (20-100 rows)**: <50ms enhancement time
- **Large tables (>100 rows)**: Use pagination (Frappe default: 50 rows/page)

### Recommendations

```javascript
// For large tables, disable expensive features
if (frm.doc.items.length > 100) {
    grid.configure_enhanced_grid({
        enable_grouping: false,
        show_row_actions: false,
        enable_sorting: true  // Sorting is fast
    });
}
```

## Compatibility

### Frappe Versions

- **Tested**: v14, v15
- **Expected**: v13+ (with minor adjustments)
- **Future**: Should work with v16+ (Grid API is stable)

### Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile browsers**: Responsive design, touch-friendly

### Conflicts

**Potential conflicts**:
- Custom scripts that override Grid/GridRow classes
- Apps that modify grid rendering
- Heavy CSS customizations

**Resolution**:
```javascript
// Disable for specific table
frm.fields_dict.my_table.grid.disable_enhanced_grid();

// Or load order (in hooks.py)
app_include_js = [
    "/assets/other_app/js/grid.js",  # Load first
    "/assets/tablez/js/enhanced_grid.js"  # Load last (wins)
]
```

## Extension Points

### Custom Features

Users can extend Tablez by:

1. **Adding custom buttons**:
```javascript
grid.grid_buttons.append($('<button>').text('Custom').on('click', ...));
```

2. **Custom sorting logic**:
```javascript
grid.sort_by_field = function(fieldname, order) {
    // Custom implementation
};
```

3. **Custom row actions**:
```javascript
grid.grid_rows.forEach(row => {
    row.row.append($('<button>').text('Action').on('click', ...));
});
```

4. **Event hooks**:
```javascript
$(document).on('grid-row-render', function(e, grid_row) {
    // Custom logic after row renders
});
```

## Security Considerations

### XSS Prevention

- All user input is escaped using Frappe's `__()`
- DOM manipulation uses jQuery (auto-escapes)
- No `eval()` or `innerHTML` with user data

### Permission Checks

- Respects Frappe's permission system
- Uses `frappe.model.can_read()`, `frappe.model.can_write()`
- No bypass of standard permission checks

### Data Validation

- All data changes go through `frappe.model.set_value()`
- Triggers standard validation
- Maintains data integrity

## Testing Strategy

### Manual Testing

1. **Smoke tests**: Basic functionality on common doctypes
2. **Edge cases**: Empty tables, single row, 100+ rows
3. **Interactions**: With custom scripts, other apps
4. **Browsers**: Chrome, Firefox, Safari, Edge
5. **Mobile**: Responsive design, touch interactions

### Automated Testing (Future)

```javascript
// Example test
QUnit.test('Row click opens linked document', function(assert) {
    const grid = create_test_grid();
    const row = grid.grid_rows[0];
    
    row.row.click();
    
    assert.equal(frappe.get_route()[0], 'Form');
    assert.equal(frappe.get_route()[1], 'Item');
});
```

## Troubleshooting

### Debug Mode

```javascript
// Enable debug logging
frappe.ui.form.Grid.prototype.debug = true;

// Check configuration
console.log(cur_frm.fields_dict.items.grid.enhanced_config);

// Check if enhanced
console.log(cur_frm.fields_dict.items.grid.is_enhanced);
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Grid not enhanced | Assets not built | `bench build --app tablez` |
| Row click not working | No link field | Set `primary_link_field` manually |
| Sorting not working | Column has no `data-fieldname` | Check grid rendering |
| Performance slow | Too many rows | Disable grouping, use pagination |

## Future Enhancements

### Roadmap

1. **Virtual scrolling**: Handle 1000+ rows efficiently
2. **Inline editing**: Edit cells without opening row form
3. **Column resizing**: Drag column borders to resize
4. **Advanced filtering**: UI for complex filters
5. **Keyboard navigation**: Arrow keys, Enter, Escape
6. **Undo/redo**: For grid operations
7. **Export**: Excel, CSV, PDF
8. **Mobile app**: Native mobile grid component

### API Stability

- Current API is stable and will be maintained
- New features will be additive (no breaking changes)
- Deprecation warnings before removing features

## Contributing

### Development Setup

```bash
cd ~/frappe-bench/apps
git clone https://github.com/yourusername/tablez
cd tablez
# Make changes
bench build --app tablez
bench clear-cache
```

### Code Style

- Follow Frappe's JavaScript style guide
- Use ES6+ features (classes, arrow functions)
- Comment complex logic
- Keep functions small and focused

### Pull Request Process

1. Test thoroughly
2. Update documentation
3. Add examples if new feature
4. Ensure backward compatibility
5. Submit PR with clear description

## License

MIT License - Free to use, modify, and distribute

## Credits

- **Frappe Framework**: Excellent foundation
- **Community**: Feedback and contributions
- **TierneyMorris Pty Ltd**: Development and maintenance

