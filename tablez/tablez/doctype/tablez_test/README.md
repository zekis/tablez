# Tablez Test DocType

A test DocType for demonstrating and testing Tablez grid enhancements.

## Features

### Parent DocType: Tablez Test
- **Title**: Main identifier
- **Status**: Draft/Submitted/Approved/Rejected
- **Date**: Date field
- **Items**: Child table **WITH Tablez enhancements** ✨
- **Totals**: Auto-calculated from items
- **Test Notes**: Child table **WITHOUT Tablez** (vanilla Frappe grid for comparison)
- **Notes**: Text editor field

### Child DocType: Tablez Test Item
- **Item Name**: Link to Tablez Product (auto-populates other fields)
- **Item Code**: Auto-populated from product
- **Quantity**: Float field
- **Rate**: Auto-populated from product, editable
- **Amount**: Auto-calculated (Quantity × Rate)
- **Category**: Auto-populated from product
- **Delivery Date**: Date field
- **Description**: Auto-populated from product
- **Is Active**: Checkbox field

### Linked DocType: Tablez Product
- **Product Name**: Unique identifier
- **Product Code**: Optional unique code
- **Category**: Electronics/Furniture/Clothing/Food/Other
- **Default Rate**: Default price
- **Description**: Rich text description
- **Product Image**: Attach image

### Child DocType: Tablez Test Note (Vanilla Grid)
- **Note**: Small text field
- **Date**: Date field
- **Author**: Link to User
- **Priority**: Low/Medium/High/Urgent
- **Purpose**: Demonstrates vanilla Frappe grid (NO Tablez enhancements)

## Tablez Configuration

The grid comes with a **visual configurator** accessible via the "Configure Grid" button.

### Available Options

#### Basic Settings
- **Enable Tablez**: Turn Tablez enhancements on/off
- **Primary Link Field**: Field to use as primary link
- **Show Save Button**: Display save button when there are unsaved changes
- **Confirm Delete**: Ask for confirmation before deleting rows

#### Add Button Settings
- **Show Add Button**: Display custom add button
- **Add Button Label**: Customize button text
- **Add Button Action**: Choose between inline/dialog/link
- **Show Add Dialog**: Use dialog for adding rows
- **Hide Default Add Row Button**: Hide Frappe's default add button

#### Row Features
- **Enable Sorting**: Allow column sorting
- **Enable Grouping**: Allow row grouping
- **Allow Row Reorder**: Enable drag-and-drop reordering
- **Show Row Actions**: Display action buttons on rows
- **Show Edit Button**: Display edit button per row
- **Show Delete Button**: Display delete button per row

#### Row Click Settings
- **Enable Row Click**: Make rows clickable
- **Row Click Action**: Action on click (open_document/open_editor/custom)
- **Enhanced Link Clicks**: Enhanced behavior for link fields
- **Row Shift+Click Action**: Action on Shift+Click

#### Total Row Settings
- **Show Total Row**: Display totals at bottom
- Automatically sums Quantity and Amount columns

#### Display Settings
- **Hide Row Numbers**: Hide row index numbers
- **Hide Checkboxes**: Hide selection checkboxes
- **Hide Edit Icon**: Hide edit icon
- **Hide Bulk Actions**: Hide bulk action buttons
- **Actions Column Width**: Customize width of actions column

## Usage

### 1. Install the DocTypes

```bash
bench --site [your-site] migrate
```

### 2. Create Sample Products (Optional but Recommended)

**Using bench console:**
```bash
bench --site [your-site] console
```

Then in the console:
```python
from tablez.tablez.doctype.tablez_product.sample_products import create_sample_products
create_sample_products()
```

**Or using bench execute:**
```bash
bench --site [your-site] execute tablez.tablez.doctype.tablez_product.sample_products.create_sample_products
```

This creates 15 sample products (laptops, chairs, monitors, etc.) for testing.

### 3. Create a Test Document

1. Go to **Tablez Test** list
2. Click **New**
3. Fill in Title and other fields
4. Add items to the grid

### 4. Configure the Grid

1. Click **Configure Grid** button
2. Adjust settings in the dialog
3. Click **Apply**
4. Configuration is saved to localStorage

### 5. Test Features

**Add Rows:**
- Click "Add Item" button
- Select a product from the dropdown (or create new)
- Product details auto-populate (code, category, rate, description)
- Enter quantity
- Quantity × Rate = Amount (auto-calculated)

**Save Button:**
- Appears when there are unsaved changes
- Click to save the form
- Disappears after successful save

**Total Row:**
- Shows sum of Quantity and Amount
- Updates automatically

**Sorting:**
- Click column headers to sort
- Click again to reverse sort

**Row Reordering:**
- Drag rows to reorder (if enabled)

## Configuration Persistence

The configuration is saved to **localStorage** with key `tablez_test_config`.

To reset to defaults:
```javascript
localStorage.removeItem('tablez_test_config');
```

Then refresh the page.

## Testing Scenarios

### Scenario 1: Basic Add/Edit/Delete
1. Enable: Show Add Button, Show Save Button
2. Add items using "Add Item" button
3. Edit values inline
4. Save using Save button
5. Delete rows (with confirmation if enabled)

### Scenario 2: Total Row
1. Enable: Show Total Row
2. Add multiple items with quantities and rates
3. Observe totals updating automatically

### Scenario 3: Custom Styling
1. Enable: Hide Row Numbers, Hide Checkboxes
2. Observe cleaner grid appearance

### Scenario 4: Row Actions
1. Enable: Show Row Actions, Show Edit Button, Show Delete Button
2. Observe action buttons on each row

### Scenario 5: Row Click
1. Enable: Enable Row Click
2. Set Row Click Action to "open_editor"
3. Click rows to open editor

## Troubleshooting

**Configuration not applying:**
- Check browser console for errors
- Clear localStorage and try again
- Refresh the page

**Save button not appearing:**
- Make sure Show Save Button is enabled
- Make changes to trigger dirty state
- Check that form is not read-only

**Totals not calculating:**
- Check that show_total_row is enabled
- Verify total_row_config has correct column mappings

## Development

To modify the default configuration, edit `get_saved_config()` in `tablez_test.js`.

To add more test fields, edit the DocType JSON files and run:
```bash
bench --site [your-site] migrate
```

