using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Lots;

public record GetAllLotsQuery(
    Guid? StockItemId = null,
    Guid? WarehouseId = null,
    bool? ExpiringOnly = null,
    bool? LowStockOnly = null,
    bool? ExcludeExpired = null,
    int? PageNumber = null,
    int? PageSize = null
) : IRequest<Result<IEnumerable<StockLotDto>>>;

public class GetAllLotsQueryHandler : IRequestHandler<GetAllLotsQuery, Result<IEnumerable<StockLotDto>>>
{
    private readonly StockDbContext _context;
    public GetAllLotsQueryHandler(StockDbContext context) => _context = context;

    public async Task<Result<IEnumerable<StockLotDto>>> Handle(GetAllLotsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.StockLots.AsNoTracking().AsQueryable();

        if (request.StockItemId.HasValue)
            query = query.Where(l => l.StockItemId == request.StockItemId.Value);

        if (request.WarehouseId.HasValue)
            query = query.Where(l => l.WarehouseId == request.WarehouseId.Value);

        if (request.ExcludeExpired == true)
            query = query.Where(l => !l.ExpiryDate.HasValue || l.ExpiryDate.Value > DateTime.UtcNow);

        var lots = await query.OrderByDescending(l => l.ReceivedAt).ToListAsync(cancellationToken);

        // Filter in memory (computed properties)
        if (request.ExpiringOnly == true)
            lots = lots.Where(l => l.ExpiryDate.HasValue && l.ExpiryDate.Value > DateTime.UtcNow && l.ExpiryDate.Value <= DateTime.UtcNow.AddDays(30)).ToList();

        if (request.LowStockOnly == true)
            lots = lots.Where(l => l.IsLowStock).ToList();

        // Pagination
        int pageNumber = request.PageNumber ?? 1;
        int pageSize = request.PageSize ?? 100;
        var pagedLots = lots.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();

        // Fetch related names
        var itemIds = pagedLots.Select(l => l.StockItemId).Distinct().ToList();
        var warehouseIds = pagedLots.Select(l => l.WarehouseId).Distinct().ToList();

        var items = await _context.StockItems.Where(i => itemIds.Contains(i.Id)).ToListAsync(cancellationToken);
        var warehouses = await _context.Warehouses.Where(w => warehouseIds.Contains(w.Id)).ToListAsync(cancellationToken);

        var dtos = pagedLots.Select(l =>
        {
            var item = items.FirstOrDefault(i => i.Id == l.StockItemId);
            var wh = warehouses.FirstOrDefault(w => w.Id == l.WarehouseId);
            return new StockLotDto
            {
                Id = l.Id,
                StockItemId = l.StockItemId,
                StockItemName = item?.Name ?? string.Empty,
                StockItemReference = item?.Reference ?? string.Empty,
                WarehouseId = l.WarehouseId,
                WarehouseName = wh?.Name ?? string.Empty,
                LotNumber = l.LotNumber?.Value ?? string.Empty,
                SerialNumber = l.SerialNumber,
                CurrentQuantity = l.CurrentQuantity.Value,
                CurrentUnit = l.CurrentQuantity.Unit.ToString(),
                InitialQuantity = l.InitialQuantity.Value,
                InitialUnit = l.InitialQuantity.Unit.ToString(),
                ExpiryDate = l.ExpiryDate,
                ReceivedAt = l.ReceivedAt,
                UnitCost = l.UnitCost.Amount,
                Currency = l.UnitCost.Currency,
                IsExpired = l.IsExpired,
                IsLowStock = l.IsLowStock,
                LowStockThreshold = l.LowStockThreshold
            };
        });

        return Result<IEnumerable<StockLotDto>>.Success(dtos);
    }
}
