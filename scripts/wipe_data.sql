-- Clean Test Data Script for POS System
-- This script wipes transactions, products, and memberships but keeps User and Store accounts.

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Wipe Sales & Transactions
TRUNCATE TABLE SaleItem;
TRUNCATE TABLE Prescription;
TRUNCATE TABLE ApprovalLog;
TRUNCATE TABLE Sale;

-- 2. Wipe Inventory & Products
TRUNCATE TABLE Batch;
TRUNCATE TABLE StockAdjustment;
TRUNCATE TABLE Product;

-- 3. Wipe Restaurant Data
TRUNCATE TABLE RestaurantTable;

-- 4. Wipe Gym Data
TRUNCATE TABLE CheckIn;
TRUNCATE TABLE Subscription;
TRUNCATE TABLE Member;
TRUNCATE TABLE MembershipPlan;

SET FOREIGN_KEY_CHECKS = 1;

-- Finished! All transaction, inventory, and business data has been reset.
-- Note: Your User accounts and Store configurations are still active.
