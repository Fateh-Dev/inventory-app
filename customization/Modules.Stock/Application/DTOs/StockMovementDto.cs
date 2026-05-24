using System;
using System.Collections.Generic;

namespace Modules.Stock.Application.DTOs;

public class StockMovementDto
{
    public Guid Id { get; set; }
    public string MovementNumber { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int TypeId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int StatusId { get; set; }
    public Guid? SourceWarehouseId { get; set; }
    public string? SourceWarehouseName { get; set; }
    public Guid? DestinationWarehouseId { get; set; }
    public string? DestinationWarehouseName { get; set; }
    public Guid? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public Guid? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string? Reference { get; set; }
    public DateTime MovementDate { get; set; }
    public string? Notes { get; set; }
    public string CreatedByUser { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public decimal TotalValue { get; set; }
    public List<StockMovementLineDto> Lines { get; set; } = new();
}
