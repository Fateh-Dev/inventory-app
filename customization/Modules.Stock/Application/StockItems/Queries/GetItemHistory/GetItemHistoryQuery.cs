using System;
using System.Collections.Generic;
using MediatR;
using SharedKernel;

namespace Modules.Stock.Application.StockItems.Queries.GetItemHistory;

public record ItemMovementHistoryDto
{
    public Guid MovementId { get; init; }
    public string MovementNumber { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty;
    public string TypeFr { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public DateTime MovementDate { get; init; }
    public decimal Quantity { get; init; }
    public string Unit { get; init; } = string.Empty;
    public string? LotNumber { get; init; }
    public string? SourceWarehouseName { get; init; }
    public string? DestinationWarehouseName { get; init; }
    public string? DepartmentName { get; init; }
    public string? SupplierName { get; init; }
    public string CreatedByUser { get; init; } = string.Empty;
    public string? Reference { get; init; }
    public string? Notes { get; init; }
}

public record GetItemHistoryQuery(Guid StockItemId, int? PageNumber = null, int? PageSize = null)
    : IRequest<Result<IEnumerable<ItemMovementHistoryDto>>>;
