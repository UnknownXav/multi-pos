-- CreateIndex
CREATE INDEX `Product_storeId_idx` ON `Product`(`storeId`);

-- CreateIndex
CREATE INDEX `RestaurantTable_storeId_idx` ON `RestaurantTable`(`storeId`);

-- CreateIndex
CREATE INDEX `Sale_createdAt_idx` ON `Sale`(`createdAt`);

-- RenameIndex
ALTER TABLE `sale` RENAME INDEX `Sale_storeId_fkey` TO `Sale_storeId_idx`;

-- RenameIndex
ALTER TABLE `saleitem` RENAME INDEX `SaleItem_saleId_fkey` TO `SaleItem_saleId_idx`;

-- RenameIndex
ALTER TABLE `stockadjustment` RENAME INDEX `StockAdjustment_productId_fkey` TO `StockAdjustment_productId_idx`;
