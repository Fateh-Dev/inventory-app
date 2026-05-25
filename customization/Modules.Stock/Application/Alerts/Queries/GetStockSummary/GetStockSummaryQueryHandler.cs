using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Alerts.Queries.GetStockSummary;

public class GetStockSummaryQueryHandler : IRequestHandler<GetStockSummaryQuery, Result<StockSummaryDto>>
{
    private readonly StockDbContext _context;

    public GetStockSummaryQueryHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<StockSummaryDto>> Handle(GetStockSummaryQuery request, CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;
        var expiringLimit = DateTime.UtcNow.AddDays(30);

        // Fetch counts and aggregations using projection to avoid loading all entity models into EF change tracker/memory
        var stockItemsSummary = await _context.StockItems
            .Select(i => new
            {
                i.IsActive,
                TotalQuantity = i.Lots.Where(l => !(l.ExpiryDate != null && l.ExpiryDate.Value.Date <= today)).Sum(l => l.CurrentQuantity.Value),
                DefaultLowStockThreshold = i.DefaultLowStockThreshold,
                ExpiringLotCount = i.Lots.Count(l => l.ExpiryDate != null && l.ExpiryDate.Value.Date <= expiringLimit && !(l.ExpiryDate != null && l.ExpiryDate.Value.Date <= today)),
                ExpiredLotCount = i.Lots.Count(l => l.ExpiryDate != null && l.ExpiryDate.Value.Date <= today),
                CategoryId = i.CategoryId
            })
            .ToListAsync(cancellationToken);

        var totalItems = stockItemsSummary.Count;
        var activeItems = stockItemsSummary.Count(s => s.IsActive);
        var lowStockCount = stockItemsSummary.Count(s => s.TotalQuantity <= s.DefaultLowStockThreshold);
        var expiringCount = stockItemsSummary.Sum(s => s.ExpiringLotCount);
        var expiredCount = stockItemsSummary.Sum(s => s.ExpiredLotCount);

        var totalWarehouses = await _context.Warehouses.CountAsync(cancellationToken);
        var unreadAlerts = await _context.StockAlerts.CountAsync(a => !a.IsRead, cancellationToken);
        var categories = await _context.Categories.AsNoTracking().ToDictionaryAsync(c => c.Id, c => c.Name, cancellationToken);

        var summary = new StockSummaryDto
        {
            TotalItems = totalItems,
            ActiveItems = activeItems,
            LowStockCount = lowStockCount,
            ExpiringCount = expiringCount,
            ExpiredCount = expiredCount,
            TotalWarehouses = totalWarehouses,
            UnreadAlerts = unreadAlerts,
            CategoryBreakdown = stockItemsSummary
                .GroupBy(s => s.CategoryId)
                .Select(g => new CategoryStockDto
                {
                    Category = categories.ContainsKey(g.Key) ? categories[g.Key] : "Inconnue",
                    ItemCount = g.Count(),
                    TotalQuantity = g.Sum(s => s.TotalQuantity)
                })
                .ToList()
        };

        return Result<StockSummaryDto>.Success(summary);
    }
}
