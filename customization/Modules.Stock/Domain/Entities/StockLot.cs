using System;
using Modules.Stock.Domain.ValueObjects;
using SharedKernel;

namespace Modules.Stock.Domain.Entities;

public class StockLot : Entity
{
    public Guid StockItemId { get; private set; }
    public Guid WarehouseId { get; private set; }
    public LotNumber LotNumber { get; private set; }
    public string? SerialNumber { get; private set; }
    public Quantity CurrentQuantity { get; private set; }
    public Quantity InitialQuantity { get; private set; }
    public DateTime? ExpiryDate { get; private set; }
    public DateTime ReceivedAt { get; private set; }
    public MoneyAmount UnitCost { get; private set; }
    public decimal LowStockThreshold { get; private set; }

    public bool IsExpired => ExpiryDate.HasValue && ExpiryDate.Value.Date <= DateTime.UtcNow.Date;
    public bool IsLowStock => CurrentQuantity.Value <= LowStockThreshold;

    private StockLot() { } // EF Core

    private StockLot(Guid stockItemId, Guid warehouseId, LotNumber lotNumber, Quantity initialQuantity, MoneyAmount unitCost, DateTime? expiryDate, decimal lowStockThreshold, string? serialNumber)
    {
        Id = Guid.NewGuid();
        StockItemId = stockItemId;
        WarehouseId = warehouseId;
        LotNumber = lotNumber;
        InitialQuantity = initialQuantity;
        CurrentQuantity = Quantity.Create(initialQuantity.Value, initialQuantity.Unit);
        UnitCost = unitCost;
        ExpiryDate = expiryDate;
        LowStockThreshold = lowStockThreshold;
        SerialNumber = serialNumber;
        ReceivedAt = DateTime.UtcNow;
    }

    public static StockLot Create(Guid stockItemId, Guid warehouseId, LotNumber lot, Quantity qty, MoneyAmount unitCost, DateTime? expiryDate, decimal lowStockThreshold, string? serialNumber)
    {
        return new StockLot(stockItemId, warehouseId, lot, qty, unitCost, expiryDate, lowStockThreshold, serialNumber);
    }

    public void Consume(decimal qty)
    {
        if (qty < 0)
            throw new ArgumentException("Consume quantity must be positive");

        if (CurrentQuantity.Value < qty)
            throw new InvalidOperationException("Insufficient stock to consume");

        CurrentQuantity = Quantity.Create(CurrentQuantity.Value - qty, CurrentQuantity.Unit);
    }

    public void Replenish(decimal qty)
    {
        if (qty < 0)
            throw new ArgumentException("Replenish quantity must be positive");

        CurrentQuantity = Quantity.Create(CurrentQuantity.Value + qty, CurrentQuantity.Unit);
    }

    public void Adjust(decimal newQty, string reason)
    {
        if (newQty < 0)
            throw new ArgumentException("Adjusted quantity cannot be negative");

        CurrentQuantity = Quantity.Create(newQty, CurrentQuantity.Unit);
    }
}
