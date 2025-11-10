# TASK03: Unsaved Row Indicator with Save Button

## Feature Intent

### Problem
When users add new rows to child tables, the rows are not saved to the database until the parent form is saved. This creates confusion:
- Users don't know which rows are unsaved
- Users might navigate away and lose their changes
- No visual indicator of unsaved state
- No quick way to save without scrolling to top of form

### Solution
Add a visual indicator and Save button for unsaved rows:
- **Visual Indicator**: Show a "Save" icon next to the Delete button for unsaved rows
- **Save Button**: Clicking the Save icon saves the entire parent form
- **Clear Feedback**: Users can see at a glance which rows need saving
- **Quick Action**: Save without scrolling to the form's Save button

---

## Feature Specification

### Visual Design

**Unsaved Row (new row):**
```
[Edit] [Save] [Delete]
```

**Saved Row (existing row):**
```
[Edit] [Delete]
```

### Button Specifications

**Save Button:**
- **Icon**: `#icon-save` (floppy disk icon)
- **Color**: Blue/Primary (indicates action needed)
- **Size**: `btn-xs` (matches Edit/Delete buttons)
- **Tooltip**: "Save form to persist this row"
- **Action**: Calls `frm.save()` to save the parent form
- **Visibility**: Only shown for unsaved rows (`doc.__islocal === true`)

---

## Implementation Plan

### Step 1: Detect Unsaved Rows

In `enhanced_grid_row.js`, check if a row is unsaved:

```javascript
const isUnsaved = me.doc.__islocal || me.doc.__unsaved;
```

**Frappe's Unsaved Indicators:**
- `doc.__islocal`: New document not yet saved to database
- `doc.__unsaved`: Existing document with unsaved changes

### Step 2: Add Save Button to Actions Column

In the `enhance_link_fields` function, add Save button between Edit and Delete:

```javascript
// Only add Save button if row is unsaved
if (isUnsaved) {
    const $saveBtn = $(`
        <button class="btn btn-xs btn-primary tablez-save-link" 
                style="padding: 4px 12px;"
                title="Save form to persist this row">
            <svg class="icon icon-xs"><use href="#icon-save"></use></svg>
            Save
        </button>
    `);
    
    $saveBtn.on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Get the parent form
        const frm = me.grid.frm;
        
        if (frm) {
            // Save the form
            frm.save();
        } else {
            frappe.msgprint(__('Unable to save: Form not found'));
        }
    });
    
    $actionsCol.append($saveBtn);
}
```

### Step 3: Update Button Order

The Actions column should show buttons in this order:
1. **Edit** button (if `show_edit_button: true` and has link value)
2. **Save** button (if row is unsaved)
3. **Delete** button (if `show_delete_button: true`)

### Step 4: Refresh After Save

After the form saves, the row should update to remove the Save button:

```javascript
// Listen for form save event
frm.doc.on('after_save', function() {
    // Re-enhance all rows to update button visibility
    me.grid.grid_rows.forEach(function(grid_row) {
        if (grid_row.setup_enhanced_row_features) {
            grid_row.setup_enhanced_row_features(true);
        }
    });
});
```

---

## Configuration

### New Config Option

Add to `DEFAULT_CONFIG` in `enhanced_grid.js`:

```javascript
show_save_button: true,  // Show Save button for unsaved rows
```

This allows users to disable the feature if they don't want it.

---

## Use Cases

### Use Case 1: Add New Row
1. User clicks "+ Add" button
2. Fills in row data in dialog
3. Clicks "Add" in dialog
4. Row appears with **[Edit] [Save] [Delete]** buttons
5. User clicks **Save** button
6. Form saves, row persists to database
7. Save button disappears, leaving **[Edit] [Delete]**

### Use Case 2: Multiple Unsaved Rows
1. User adds 3 new rows
2. All 3 rows show **Save** button
3. User clicks **Save** on any row
4. Form saves (saves all rows)
5. All 3 Save buttons disappear

### Use Case 3: Edit Existing Row
1. User clicks **Edit** on existing row
2. Modifies data
3. Row now shows **[Edit] [Save] [Delete]** (Save appears)
4. User clicks **Save**
5. Form saves
6. Save button disappears

---

## Technical Details

### Detecting Unsaved State

**New Rows:**
```javascript
doc.__islocal === true  // Row never saved to database
```

**Modified Rows:**
```javascript
doc.__unsaved === true  // Row has unsaved changes
```

**Saved Rows:**
```javascript
!doc.__islocal && !doc.__unsaved  // Row is clean
```

### Accessing Parent Form

From a grid row, access the parent form:
```javascript
const frm = this.grid.frm;
```

### Saving the Form

```javascript
frm.save();  // Saves entire form including all child tables
```

### Post-Save Refresh

After save, Frappe automatically refreshes the grid, but we need to re-enhance rows:

```javascript
// Hook into form's after_save event
$(frm.wrapper).on('after_save', function() {
    // Re-enhance all rows
    frm.fields_dict.table_fieldname.grid.grid_rows.forEach(row => {
        if (row.setup_enhanced_row_features) {
            row.setup_enhanced_row_features(true);
        }
    });
});
```

---

## Edge Cases

### 1. Form is Unsaved (New Form)
- Parent form itself is new (`frm.doc.__islocal`)
- Save button should still work
- Saves both parent and child rows

### 2. Validation Errors
- Form save might fail due to validation
- Show Frappe's standard error messages
- Save button remains visible

### 3. Permissions
- User might not have save permission
- Frappe will handle permission check
- Show appropriate error message

### 4. Mandatory Fields
- Parent form might have mandatory fields
- Save will fail if not filled
- Standard Frappe validation applies

---

## Benefits

1. **Visual Clarity**: Users can see which rows need saving
2. **Quick Action**: Save without scrolling to form's Save button
3. **Prevent Data Loss**: Clear indicator reduces accidental navigation
4. **Better UX**: Matches user expectations from other apps
5. **Consistent**: Uses Frappe's built-in save mechanism

---

## Implementation Files

### Files to Modify:
1. `tablez/public/js/enhanced_grid.js` - Add config option
2. `tablez/public/js/enhanced_grid_row.js` - Add Save button logic

### Estimated Changes:
- ~30 lines of code
- 1 new config option
- No CSS changes needed (uses existing button styles)

---

## Testing Checklist

- [ ] Save button appears on new rows
- [ ] Save button appears on modified rows
- [ ] Save button does NOT appear on clean rows
- [ ] Clicking Save button saves the form
- [ ] Save button disappears after successful save
- [ ] Multiple unsaved rows all show Save button
- [ ] Saving one row saves all unsaved rows
- [ ] Works with form validation errors
- [ ] Works with permission restrictions
- [ ] Works on new parent forms
- [ ] Works on existing parent forms
- [ ] Button order is correct: Edit, Save, Delete
- [ ] Tooltip shows helpful text
- [ ] Config option `show_save_button: false` hides the button

---

**Status:** Ready for Implementation
**Priority:** Medium
**Complexity:** Low
**Estimated Time:** 30 minutes

