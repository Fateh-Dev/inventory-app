using System;
using Modules.Stock.Domain.ValueObjects;
using SharedKernel;

namespace Modules.Stock.Domain.Entities;

public class StockMovementLine : Entity
{
    public Guid StockMovementId { get; private set; }
    public Guid StockItemId { get; private set; }
    public Guid StockLotId { get; private set; }
    public Quantity Quantity { get; private set; }
    public MoneyAmount UnitCost { get; private set; }
    public string? Notes { get; private set; }

    private StockMovementLine() { } // EF Core

    internal StockMovementLine(Guid stockMovementId, Guid stockItemId, Guid stockLotId, Quantity quantity, MoneyAmount unitCost, string? notes)
    {
        Id = Guid.NewGuid();
        StockMovementId = stockMovementId;
        StockItemId = stockItemId;
        StockLotId = stockLotId;
        Quantity = quantity;
        UnitCost = unitCost;
        Notes = notes;
    }
}
