# Copyright (c) 2025, Tablez and contributors
# Sample products for testing

import frappe


def create_sample_products():
	"""Create sample products for testing Tablez"""
	
	sample_products = [
		{
			"product_name": "Laptop - Dell XPS 15",
			"product_code": "DELL-XPS-15",
			"category": "Electronics",
			"default_rate": 1299.99,
			"description": "High-performance laptop with 15-inch display",
			"is_active": 1
		},
		{
			"product_name": "Office Chair - Ergonomic",
			"product_code": "CHAIR-ERG-001",
			"category": "Furniture",
			"default_rate": 299.99,
			"description": "Comfortable ergonomic office chair with lumbar support",
			"is_active": 1
		},
		{
			"product_name": "Wireless Mouse",
			"product_code": "MOUSE-WL-001",
			"category": "Electronics",
			"default_rate": 29.99,
			"description": "Wireless optical mouse with USB receiver",
			"is_active": 1
		},
		{
			"product_name": "Standing Desk",
			"product_code": "DESK-STD-001",
			"category": "Furniture",
			"default_rate": 499.99,
			"description": "Adjustable height standing desk",
			"is_active": 1
		},
		{
			"product_name": "Monitor - 27 inch 4K",
			"product_code": "MON-27-4K",
			"category": "Electronics",
			"default_rate": 399.99,
			"description": "27-inch 4K UHD monitor with IPS panel",
			"is_active": 1
		},
		{
			"product_name": "Mechanical Keyboard",
			"product_code": "KB-MECH-001",
			"category": "Electronics",
			"default_rate": 149.99,
			"description": "RGB mechanical keyboard with Cherry MX switches",
			"is_active": 1
		},
		{
			"product_name": "Desk Lamp - LED",
			"product_code": "LAMP-LED-001",
			"category": "Electronics",
			"default_rate": 49.99,
			"description": "Adjustable LED desk lamp with touch controls",
			"is_active": 1
		},
		{
			"product_name": "Bookshelf - 5 Tier",
			"product_code": "SHELF-5T-001",
			"category": "Furniture",
			"default_rate": 89.99,
			"description": "5-tier wooden bookshelf",
			"is_active": 1
		},
		{
			"product_name": "Coffee Mug - Insulated",
			"product_code": "MUG-INS-001",
			"category": "Other",
			"default_rate": 19.99,
			"description": "Stainless steel insulated coffee mug",
			"is_active": 1
		},
		{
			"product_name": "Notebook - A4",
			"product_code": "NOTE-A4-001",
			"category": "Other",
			"default_rate": 4.99,
			"description": "A4 ruled notebook, 200 pages",
			"is_active": 1
		},
		{
			"product_name": "Headphones - Noise Cancelling",
			"product_code": "HP-NC-001",
			"category": "Electronics",
			"default_rate": 249.99,
			"description": "Over-ear noise cancelling headphones",
			"is_active": 1
		},
		{
			"product_name": "Webcam - 1080p",
			"product_code": "CAM-1080-001",
			"category": "Electronics",
			"default_rate": 79.99,
			"description": "Full HD 1080p webcam with microphone",
			"is_active": 1
		},
		{
			"product_name": "Filing Cabinet - 3 Drawer",
			"product_code": "CAB-3D-001",
			"category": "Furniture",
			"default_rate": 199.99,
			"description": "Metal filing cabinet with 3 drawers",
			"is_active": 1
		},
		{
			"product_name": "Whiteboard - 4x6 ft",
			"product_code": "WB-4X6-001",
			"category": "Other",
			"default_rate": 129.99,
			"description": "Magnetic whiteboard with aluminum frame",
			"is_active": 1
		},
		{
			"product_name": "USB Hub - 7 Port",
			"product_code": "USB-HUB-7P",
			"category": "Electronics",
			"default_rate": 34.99,
			"description": "7-port USB 3.0 hub with power adapter",
			"is_active": 1
		}
	]
	
	created = 0
	skipped = 0
	
	for product_data in sample_products:
		if not frappe.db.exists("Tablez Product", product_data["product_name"]):
			try:
				product = frappe.get_doc({
					"doctype": "Tablez Product",
					**product_data
				})
				product.insert()
				created += 1
				print(f"Created: {product_data['product_name']}")
			except Exception as e:
				print(f"Error creating {product_data['product_name']}: {str(e)}")
		else:
			skipped += 1
			print(f"Skipped (already exists): {product_data['product_name']}")
	
	frappe.db.commit()
	
	print(f"\nSummary:")
	print(f"Created: {created}")
	print(f"Skipped: {skipped}")
	print(f"Total: {len(sample_products)}")
	
	return {
		"created": created,
		"skipped": skipped,
		"total": len(sample_products)
	}


if __name__ == "__main__":
	create_sample_products()

