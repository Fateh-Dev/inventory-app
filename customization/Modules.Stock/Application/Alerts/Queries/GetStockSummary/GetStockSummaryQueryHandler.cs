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
        var items = await _context.StockItems.Include(i => i.Lots).AsNoTracking().ToListAsync(cancellationToken);
        
        var totalWarehouses = await _context.Warehouses.CountAsync(cancellationToken);
        var unreadAlerts = await _context.StockAlerts.CountAsync(a => !a.IsRead, cancellationToken);
        var categories = await _context.Categories.AsNoTracking().ToDictionaryAsync(c => c.Id, c => c.Name, cancellationToken);

        var summary = new StockSummaryDto
        {
            TotalItems = items.Count,
            ActiveItems = items.Count(i => i.IsActive),
            LowStockCount = items.Count(i => i.IsLowStock),
            ExpiringCount = items.Sum(i => i.ExpiringLotCount),
            ExpiredCount = items.Sum(i => i.Lots.Count(l => l.IsExpired)),
            TotalWarehouses = totalWarehouses,
            UnreadAlerts = unreadAlerts,
            CategoryBreakdown = items
                .GroupBy(i => i.CategoryId)
                .Select(g => new CategoryStockDto
                {
                    Category = categories.ContainsKey(g.Key) ? categories[g.Key] : "Inconnue",
                    ItemCount = g.Count(),
                    TotalQuantity = g.Sum(i => i.TotalQuantity)
                })
                .ToList()
        };

        return Result<StockSummaryDto>.Success(summary);
    }
}
