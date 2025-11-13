# Copyright (c) 2025, Tablez and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class TablezTest(Document):
	def validate(self):
		"""Calculate totals and amounts"""
		self.calculate_totals()
	
	def calculate_totals(self):
		"""Calculate total quantity and amount from items"""
		total_qty = 0
		total_amt = 0
		
		for item in self.items:
			# Calculate amount for each item
			if item.quantity and item.rate:
				item.amount = item.quantity * item.rate
			else:
				item.amount = 0
			
			# Add to totals
			total_qty += item.quantity or 0
			total_amt += item.amount or 0
		
		self.total_quantity = total_qty
		self.total_amount = total_amt

