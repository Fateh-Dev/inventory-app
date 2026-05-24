using System.Collections.Generic;

namespace Modules.Stock.Application.DTOs;

public class StockSummaryDto
{
    public int TotalItems { get; set; }
    public int ActiveItems { get; set; }
    public int LowStockCount { get; set; }
    public int ExpiringCount { get; set; }
    public int ExpiredCount { get; set; }
    public int TotalWarehouses { get; set; }
    public int UnreadAlerts { get; set; }
    public List<CategoryStockDto> CategoryBreakdown { get; set; } = new();
}

public class CategoryStockDto
{
    public string Category { get; set; } = string.Empty;
    public int ItemCount { get; set; }
    public decimal TotalQuantity { get; set; }
}
