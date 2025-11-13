# Tablez Product DocType

A simple product master for testing Tablez link field functionality.

## Purpose

This DocType serves as a linked master for the **Tablez Test Item** child table, allowing you to test:
- Link field behavior in grids
- `add_button_action: 'link'` - Creating new products from the grid
- Auto-population of fields when a product is selected
- Quick entry forms

## Fields

- **Product Name**: Unique identifier (used as document name)
- **Product Code**: Optional unique code
- **Category**: Electronics/Furniture/Clothing/Food/Other
- **Is Active**: Active status
- **Default Rate**: Default price for the product
- **Unit of Measure**: Link to UOM (optional)
- **Description**: Rich text description
- **Product Image**: Attach image

## Features

### Quick Entry
The DocType has `quick_entry: 1` enabled, so you can create products quickly from the link field.

### Auto-Population
When you select a product in Tablez Test Item, it automatically populates:
- Item Code
- Category
- Rate (from Default Rate)
- Description

## Sample Products

A script is provided to create 15 sample products for testing.

### Create Sample Products

**Method 1: Using bench console**
```bash
bench --site your-site console
```

Then in the console:
```python
from tablez.tablez.doctype.tablez_product.sample_products import create_sample_products
create_sample_products()
```

**Method 2: Using bench execute**
```bash
bench --site your-site execute tablez.tablez.doctype.tablez_product.sample_products.create_sample_products
```

### Sample Products List

The script creates 15 products:
1. Laptop - Dell XPS 15 ($1,299.99)
2. Office Chair - Ergonomic ($299.99)
3. Wireless Mouse ($29.99)
4. Standing Desk ($499.99)
5. Monitor - 27 inch 4K ($399.99)
6. Mechanical Keyboard ($149.99)
7. Desk Lamp - LED ($49.99)
8. Bookshelf - 5 Tier ($89.99)
9. Coffee Mug - Insulated ($19.99)
10. Notebook - A4 ($4.99)
11. Headphones - Noise Cancelling ($249.99)
12. Webcam - 1080p ($79.99)
13. Filing Cabinet - 3 Drawer ($199.99)
14. Whiteboard - 4x6 ft ($129.99)
15. USB Hub - 7 Port ($34.99)

## Testing Link Functionality

### Test 1: Basic Link Selection
1. Create a Tablez Test document
2. Add an item
3. Click on Item Name field
4. Select a product from the list
5. Observe auto-population of fields

### Test 2: Quick Entry
1. Create a Tablez Test document
2. Add an item
3. Click on Item Name field
4. Click "Create a new Tablez Product"
5. Fill in the quick entry form
6. Save
7. Product is created and selected

### Test 3: Link Button Action
1. Configure grid with `add_button_action: 'link'`
2. Set `primary_link_field: 'item_name'`
3. Click "Add Item" button
4. Should open new Tablez Product form

### Test 4: Enhanced Link Clicks
1. Enable `enhanced_link_clicks: true`
2. Click on a product link in the grid
3. Should open the product in a new tab/dialog

## Permissions

The DocType has permissions for:
- **System Manager**: Full access
- **All**: Full access (for testing purposes)

In production, you would restrict this to specific roles.

## Integration with Tablez Test

The Tablez Test Item child table uses this as a Link field:

```json
{
  "fieldname": "item_name",
  "fieldtype": "Link",
  "options": "Tablez Product"
}
```

When a product is selected, the client script fetches product details and populates the row.

## Customization

You can add more fields to this DocType:
- Barcode
- SKU
- Weight/Dimensions
- Stock levels
- Supplier information
- etc.

Just edit the JSON file and run:
```bash
bench --site your-site migrate
```

