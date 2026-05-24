using System;

namespace Modules.Stock.Application.DTOs;

public class StockLotDto
{
    public Guid Id { get; set; }
    public Guid StockItemId { get; set; }
    public string StockItemName { get; set; } = string.Empty;
    public string StockItemReference { get; set; } = string.Empty;
    public Guid WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public string LotNumber { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public decimal CurrentQuantity { get; set; }
    public string CurrentUnit { get; set; } = string.Empty;
    public decimal InitialQuantity { get; set; }
    public string InitialUnit { get; set; } = string.Empty;
    public DateTime? ExpiryDate { get; set; }
    public DateTime ReceivedAt { get; set; }
    public decimal UnitCost { get; set; }
    public string Currency { get; set; } = string.Empty;
    public bool IsExpired { get; set; }
    public bool IsLowStock { get; set; }
    public decimal LowStockThreshold { get; set; }
}
