using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Alerts.Queries.GetAlerts;

public class GetAlertsQueryHandler : IRequestHandler<GetAlertsQuery, Result<IEnumerable<StockAlertDto>>>
{
    private readonly StockDbContext _context;

    public GetAlertsQueryHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<IEnumerable<StockAlertDto>>> Handle(GetAlertsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.StockAlerts.AsNoTracking();

        if (request.UnreadOnly.HasValue && request.UnreadOnly.Value)
            query = query.Where(a => !a.IsRead);

        if (request.UnresolvedOnly.HasValue && request.UnresolvedOnly.Value)
            query = query.Where(a => !a.IsResolved);

        if (request.StockItemId.HasValue)
            query = query.Where(a => a.StockItemId == request.StockItemId.Value);

        var alerts = await query.ToListAsync(cancellationToken);

        var itemIds = alerts.Select(a => a.StockItemId).Distinct().ToList();
        var items = await _context.StockItems.AsNoTracking()
            .Where(i => itemIds.Contains(i.Id))
            .ToDictionaryAsync(i => i.Id, i => new { i.Reference, i.Name }, cancellationToken);

        var warehouseIds = alerts.Where(a => a.WarehouseId.HasValue).Select(a => a.WarehouseId.Value).Distinct().ToList();
        var warehouses = await _context.Warehouses.AsNoTracking()
            .Where(w => warehouseIds.Contains(w.Id))
            .ToDictionaryAsync(w => w.Id, w => w.Name, cancellationToken);

        var dtos = alerts.Select(a => new StockAlertDto
        {
            Id = a.Id,
            StockItemId = a.StockItemId,
            StockItemReference = items.ContainsKey(a.StockItemId) ? items[a.StockItemId].Reference : "N/A",
            StockItemName = items.ContainsKey(a.StockItemId) ? items[a.StockItemId].Name : "N/A",
            WarehouseId = a.WarehouseId,
            WarehouseName = a.WarehouseId.HasValue && warehouses.ContainsKey(a.WarehouseId.Value) ? warehouses[a.WarehouseId.Value] : "N/A",
            Severity = a.Severity.ToString(),
            SeverityId = (int)a.Severity,
            Message = a.Message,
            AlertType = a.AlertType,
            IsRead = a.IsRead,
            IsResolved = a.IsResolved,
            ResolvedAt = a.ResolvedAt,
            Resolution = a.Resolution,
            CreatedAt = a.CreatedAt
        });

        return Result<IEnumerable<StockAlertDto>>.Success(dtos);
    }
}
