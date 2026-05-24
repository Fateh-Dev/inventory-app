using System;

namespace Modules.Stock.Application.DTOs;

public class StockItemDto
{
    public Guid Id { get; set; }
    public string Reference { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public string DefaultUnit { get; set; } = string.Empty;
    public int DefaultUnitId { get; set; }
    public Guid? BrandId { get; set; }
    public string? BrandName { get; set; }
    public Guid? BrandModelId { get; set; }
    public string? BrandModelName { get; set; }
    public bool RequiresSerialNumber { get; set; }
    public bool HasExpiryDate { get; set; }
    public decimal DefaultLowStockThreshold { get; set; }
    public bool IsActive { get; set; }
    public Guid? DefaultSupplierId { get; set; }
    public string? DefaultSupplierName { get; set; }
    public decimal TotalQuantity { get; set; }
    public bool IsLowStock { get; set; }
    public int ExpiringLotCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
