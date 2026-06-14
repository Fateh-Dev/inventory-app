using System;

namespace Modules.Stock.Application.DTOs;

public class StockMovementLineDto
{
    public Guid Id { get; set; }
    public Guid StockItemId { get; set; }
    public string StockItemName { get; set; } = string.Empty;
    public string StockItemReference { get; set; } = string.Empty;
    public Guid? StockLotId { get; set; }
    public string LotNumber { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitCost { get; set; }
    public string Currency { get; set; } = string.Empty;
    public decimal LineTotal { get; set; }
    public string Notes { get; set; } = string.Empty;
    public DateTime? ExpiryDate { get; set; }
    public string? SerialNumber { get; set; }
}
