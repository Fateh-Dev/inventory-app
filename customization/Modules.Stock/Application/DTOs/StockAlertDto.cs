using System;

namespace Modules.Stock.Application.DTOs;

public class StockAlertDto
{
    public Guid Id { get; set; }
    public Guid StockItemId { get; set; }
    public string StockItemReference { get; set; } = string.Empty;
    public string StockItemName { get; set; } = string.Empty;
    public Guid? WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public string Severity { get; set; } = string.Empty;
    public int SeverityId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string AlertType { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public bool IsResolved { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? Resolution { get; set; }
    public DateTime CreatedAt { get; set; }
}
