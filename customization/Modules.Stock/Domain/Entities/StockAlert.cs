using System;
using Modules.Stock.Domain.Enums;
using SharedKernel;

namespace Modules.Stock.Domain.Entities;

public class StockAlert : AggregateRoot
{
    public Guid StockItemId { get; private set; }
    public Guid? WarehouseId { get; private set; }
    public AlertSeverity Severity { get; private set; }
    public string Message { get; private set; }
    public string AlertType { get; private set; }
    public bool IsRead { get; private set; }
    public bool IsResolved { get; private set; }
    public DateTime? ResolvedAt { get; private set; }
    public string? Resolution { get; private set; }

    private StockAlert() { }

    private StockAlert(Guid stockItemId, Guid? warehouseId, AlertSeverity severity, string message, string alertType)
    {
        Id = Guid.NewGuid();
        StockItemId = stockItemId;
        WarehouseId = warehouseId;
        Severity = severity;
        Message = message;
        AlertType = alertType;
        IsRead = false;
        IsResolved = false;
    }

    public static StockAlert Create(Guid stockItemId, Guid? warehouseId, AlertSeverity severity, string message, string alertType)
    {
        return new StockAlert(stockItemId, warehouseId, severity, message, alertType);
    }

    public void MarkRead()
    {
        IsRead = true;
    }

    public void Resolve(string resolution)
    {
        IsResolved = true;
        ResolvedAt = DateTime.UtcNow;
        Resolution = resolution;
    }
}
