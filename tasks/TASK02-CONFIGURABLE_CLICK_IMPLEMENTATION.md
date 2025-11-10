# Configurable Click Behavior Implementation Guide

## Overview

This document provides detailed instructions for implementing configurable click behavior in the Tablez app. This feature allows users to customize what happens when they click or Shift+click on rows in child tables.

### Current Behavior (Default)
- **Click**: Opens linked document
- **Shift+Click**: Opens row editor
- **Ctrl/Cmd+Click**: Opens linked document in new tab

### After Implementation
Users can configure per-grid:
- **Click**: Choose between 'open_document' or 'open_editor'
- **Shift+Click**: Choose between 'open_document' or 'open_editor'
- **Tooltip**: Custom text or auto-generated based on actions

---

## Use Case Example

**Mobilisations Labour Table:**
- Primary action: Edit row data
- Secondary action: Navigate to Labour Type document

**Desired Configuration:**
```javascript
row_click_action: 'open_editor',           // Click opens row editor
row_shift_click_action: 'open_document',   // Shift+Click opens Labour Type
row_click_tooltip: 'Click to edit row, Shift+Click to open Labour Type'
```

---

## Implementation Steps

### Step 1: Modify enhanced_grid.js

**File:** `tablez/public/js/enhanced_grid.js`

**Location:** Around line 904, in the `DEFAULT_CONFIG` object

**Current Code:**
```javascript
allow_row_reorder: true,
enable_row_click: false,
show_total_row: false,
```

**Change To:**
```javascript
allow_row_reorder: true,
enable_row_click: false,
row_click_action: 'open_document',  // 'open_document' | 'open_editor'
row_shift_click_action: 'open_editor',  // 'open_document' | 'open_editor'
row_click_tooltip: null,  // Custom tooltip text (null = auto-generate)
show_total_row: false,
```

**What This Does:**
- Adds 3 new configuration options to the DEFAULT_CONFIG
- `row_click_action`: Controls what normal click does
- `row_shift_click_action`: Controls what Shift+click does
- `row_click_tooltip`: Allows custom tooltip or auto-generation

---

### Step 2: Modify enhanced_grid_row.js - Tooltip Generation

**File:** `tablez/public/js/enhanced_grid_row.js`

**Location:** Around line 134-138, in the `setup_row_click_handler` function

**Current Code:**
```javascript
// Add pointer cursor to indicate clickability
this.row.css('cursor', 'pointer');

// Add title to indicate behavior
this.row.attr('title', `Click to open ${primary_link}, Shift+Click to edit row`);
```

**Change To:**
```javascript
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
```

**What This Does:**
- Checks if custom tooltip is provided, uses it if so
- Otherwise, auto-generates tooltip based on configured actions
- Creates user-friendly text like "Click to edit row, Shift+Click to open labour_type"

---

### Step 3: Modify enhanced_grid_row.js - Click Handler

**File:** `tablez/public/js/enhanced_grid_row.js`

**Location:** Around line 167-203, the `clickHandler` function

**Current Code:**
```javascript
const clickHandler = function(e) {
    // Don't trigger if clicking on buttons
    const $target = $(e.target);
    if ($target.closest('button').length) {
        return;
    }

    // Stop event immediately in capture phase
    e.stopImmediatePropagation();
    e.preventDefault();

    // Check if shift key is pressed - open row editor
    if (e.shiftKey) {
        me.toggle_view(true);
        return;
    }

    // Get the link field value
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
```

**Change To:**
```javascript
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
```

**What This Does:**
- Reads the configured actions from config
- Determines which action to execute based on Shift key state
- Executes either 'open_editor' or 'open_document' action accordingly
- Maintains backward compatibility (defaults to original behavior)

---

### Step 4: Modify enhanced_grid_row.js - Final Tooltip

**File:** `tablez/public/js/enhanced_grid_row.js`

**Location:** Around line 214-216, at the end of `setup_row_click_handler`

**Current Code:**
```javascript
// Add visual indicator that row is clickable
this.row.css('cursor', 'pointer');
this.row.attr('title', __('Click to open {0}, Shift+Click to edit row', [primary_link]));
```

**Change To:**
```javascript
// Add visual indicator that row is clickable
this.row.css('cursor', 'pointer');
this.row.attr('title', __('Click to open {0}, Shift+Click to edit row', [primary_link]));
```

**Note:** This line stays the same but the tooltip is already set earlier (Step 2), so the second `.attr('title', ...)` call will overwrite it. We need to REMOVE the second tooltip line.

**Actually Change To:**
```javascript
// Update tooltip at the end (tooltip already set earlier, just update cursor)
this.row.css('cursor', 'pointer');
```

**What This Does:**
- Removes duplicate tooltip setting
- Tooltip is already set correctly in Step 2

---

## Configuration Usage

### Example 1: Reverse Click Behavior (Your Use Case)

```javascript
frappe.ui.form.on('Your DocType', {
    refresh: function(frm) {
        if (frm.fields_dict.labour && frm.fields_dict.labour.grid) {
            frm.fields_dict.labour.grid.configure_enhanced_grid({
                enable_row_click: true,
                primary_link_field: 'labour_type',

                // Reverse the click behavior
                row_click_action: 'open_editor',
                row_shift_click_action: 'open_document',
                row_click_tooltip: 'Click to edit row, Shift+Click to open Labour Type',

                show_edit_button: true,
                show_delete_button: true
            });
        }
    }
});
```

**Result:**
- Click → Opens row editor
- Shift+Click → Opens Labour Type document
- Tooltip: "Click to edit row, Shift+Click to open Labour Type"

---

### Example 2: Default Behavior (No Changes)

```javascript
frm.fields_dict.items.grid.configure_enhanced_grid({
    enable_row_click: true,
    primary_link_field: 'item_code',
    // Don't specify row_click_action - uses defaults
});
```

**Result:**
- Click → Opens Item document (default)
- Shift+Click → Opens row editor (default)
- Tooltip: Auto-generated "Click to open item_code, Shift+Click to edit row"

---

### Example 3: Both Actions Open Document

```javascript
frm.fields_dict.items.grid.configure_enhanced_grid({
    enable_row_click: true,
    primary_link_field: 'item_code',
    row_click_action: 'open_document',
    row_shift_click_action: 'open_document',
    row_click_tooltip: 'Click to open Item (Shift has no effect)'
});
```

**Result:**
- Click → Opens Item document
- Shift+Click → Also opens Item document
- Row editor only accessible via Edit button

---

### Example 4: Both Actions Open Editor

```javascript
frm.fields_dict.items.grid.configure_enhanced_grid({
    enable_row_click: true,
    primary_link_field: 'item_code',
    row_click_action: 'open_editor',
    row_shift_click_action: 'open_editor',
    row_click_tooltip: 'Click to edit row (navigation disabled)'
});
```

**Result:**
- Click → Opens row editor
- Shift+Click → Also opens row editor
- Document navigation only via Edit button in Actions column

---

## Testing Instructions

### 1. Make the Code Changes

Follow Steps 1-4 above to modify both JavaScript files.

### 2. Build Assets

SSH into your server:
```bash
ssh your-user@103.249.236.42
cd ~/frappe-bench  # or your bench location
bench build --app tablez
bench clear-cache
bench restart
```

### 3. Test in Browser

1. Hard refresh browser: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. Open a form with your configured child table
3. Verify click behavior matches your configuration
4. Check tooltip text on hover
5. Test all scenarios:
   - Normal click
   - Shift+Click
   - Ctrl/Cmd+Click (should still open in new tab)

### 4. Verify Different Configurations

Test with different config combinations to ensure all work correctly.

---

## Deployment Steps (With GitHub)

### After Zeke Gives You Access

1. **Stage the changes:**
   ```bash
   cd /Volumes/Apps/tablez
   git add tablez/public/js/enhanced_grid.js
   git add tablez/public/js/enhanced_grid_row.js
   ```

2. **Commit with descriptive message:**
   ```bash
   git commit -m "Add granular click behavior configuration options

   - Add row_click_action config: 'open_document' | 'open_editor'
   - Add row_shift_click_action config: 'open_document' | 'open_editor'
   - Add row_click_tooltip config: custom tooltip or auto-generate
   - Update click handler to use configurable actions
   - Support reversing click behavior per grid

   This allows users to configure normal click and Shift+click
   actions independently, providing full flexibility for different
   use cases (e.g., click to edit, Shift to open document).

   Addresses need for reversible click behavior in child tables
   where primary action varies by use case."
   ```

3. **Push to GitHub:**
   ```bash
   git push origin main
   ```

4. **Deploy to server:**
   ```bash
   ssh your-user@103.249.236.42
   cd ~/frappe-bench/apps/tablez
   git pull
   cd ../..
   bench build --app tablez
   bench clear-cache
   bench restart
   ```

---

## Rollback Instructions

### If You Need to Undo

**Option 1: Revert the commit (if already pushed)**
```bash
git revert HEAD
git push origin main
```

**Option 2: Reset to previous commit (if not pushed yet)**
```bash
git reset --hard HEAD~1
```

**Option 3: Manual file restoration**

Undo the changes manually by reversing Steps 1-4:

1. Remove the 3 config lines from enhanced_grid.js
2. Restore simple tooltip in enhanced_grid_row.js (line ~138)
3. Restore original click handler logic (line ~178)
4. Restore original final tooltip line (line ~216)

---

## Summary of Changes

### Files Modified: 2

1. **tablez/public/js/enhanced_grid.js**
   - Added 3 lines to DEFAULT_CONFIG (lines ~905-907)

2. **tablez/public/js/enhanced_grid_row.js**
   - Modified tooltip generation logic (~17 lines, line ~137-153)
   - Modified click handler logic (~13 lines changed, line ~178-210)
   - Simplified final tooltip line (~2 lines, line ~214-215)

### Total Lines Changed
- **Added:** ~20 lines
- **Modified:** ~15 lines
- **Removed:** ~5 lines
- **Net Change:** ~30 lines across 2 files

### Backward Compatibility
✅ Fully backward compatible - defaults to original behavior if options not specified

---

## Notes

- All changes are scoped to the `setup_row_click_handler` function in enhanced_grid_row.js
- Configuration is per-grid, allowing different tables to have different behaviors
- Custom tooltips override auto-generated ones
- Ctrl/Cmd+Click always opens document in new tab (unchanged)
- No changes to CSS or other JavaScript files required

---

**Document Created:** 2025-11-08
**Last Updated:** 2025-11-08
**Author:** Claude (AI Assistant)
**For:** Paul Johnson / Tablez Implementation