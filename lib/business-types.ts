/**
 * Business type utilities and constants
 */

export enum BusinessType {
  RETAIL = 'RETAIL',
  RESTAURANT = 'RESTAURANT',
  PHARMACY = 'PHARMACY',
  GYM = 'GYM',
  WATER_BILLING = 'WATER_BILLING',
}

export const BUSINESS_TYPES = {
  RETAIL: { label: 'Retail / Sari-Sari Store / Mini Mart', value: 'RETAIL' },
  RESTAURANT: { label: 'Restaurant / Café', value: 'RESTAURANT' },
  PHARMACY: { label: 'Pharmacy / Drugstore', value: 'PHARMACY' },
  GYM: { label: 'Gym / Fitness Studio', value: 'GYM' },
  WATER_BILLING: { label: 'Water Billing / Utility', value: 'WATER_BILLING' },
}

export const BUSINESS_TYPE_CONFIG = {
  RETAIL: {
    label: 'Retail',
    icon: '🏪',
    dashboardCards: ['Today Sales', 'Weekly Sales', 'Monthly Sales', 'Low Stock'],
    hasBarcode: true,
    hasStock: true,
    hasExpiry: false,
    hasMembership: false,
    hasTable: false,
  },
  RESTAURANT: {
    label: 'Restaurant',
    icon: '🍽️',
    dashboardCards: ['Today Sales', 'Table Occupancy', 'Weekly Sales', 'Monthly Sales'],
    hasBarcode: false,
    hasStock: true,
    hasExpiry: false,
    hasMembership: false,
    hasTable: true,
  },
  PHARMACY: {
    label: 'Pharmacy',
    icon: '💊',
    dashboardCards: ['Today Sales', 'Weekly Sales', 'Monthly Sales', 'Expiring Products'],
    hasBarcode: true,
    hasStock: true,
    hasExpiry: true,
    hasMembership: false,
    hasTable: false,
  },
  GYM: {
    label: 'Gym',
    icon: '💪',
    dashboardCards: ['Active Members', 'New Signups', 'Today Revenue', 'Monthly Revenue'],
    hasBarcode: false,
    hasStock: false,
    hasExpiry: false,
    hasMembership: true,
    hasTable: false,
  },
  WATER_BILLING: {
    label: 'Water Billing',
    icon: '💧',
    dashboardCards: ['Total Outstanding', 'Collection Today', 'New Readings', 'Overdue Accounts'],
    hasBarcode: false,
    hasStock: false,
    hasExpiry: false,
    hasMembership: false,
    hasTable: false,
    hasWater: true,
  },
}
