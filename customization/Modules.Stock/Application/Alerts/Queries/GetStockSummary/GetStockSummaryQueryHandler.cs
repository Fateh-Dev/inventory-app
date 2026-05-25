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

        // 1. Total Items
        var totalItems = await _context.StockItems.CountAsync(cancellationToken);

        // 2. Active Items
        var activeItems = await _context.StockItems.CountAsync(i => i.IsActive, cancellationToken);

        // 3. Low Stock Count
        var lowStockCount = await _context.StockItems.CountAsync(i => 
            i.Lots.Where(l => !(l.ExpiryDate != null && l.ExpiryDate.Value.Date <= today))
                  .Sum(l => l.CurrentQuantity.Value) <= i.DefaultLowStockThreshold, cancellationToken);

        // 4. Expiring soon Count
        var expiringCount = await _context.StockLots.CountAsync(l => 
            l.ExpiryDate != null && l.ExpiryDate.Value.Date <= expiringLimit && !(l.ExpiryDate.Value.Date <= today), cancellationToken);

        // 5. Expired Count
        var expiredCount = await _context.StockLots.CountAsync(l => 
            l.ExpiryDate != null && l.ExpiryDate.Value.Date <= today, cancellationToken);

        var totalWarehouses = await _context.Warehouses.CountAsync(cancellationToken);
        var unreadAlerts = await _context.StockAlerts.CountAsync(a => !a.IsRead, cancellationToken);
        var categories = await _context.Categories.AsNoTracking().ToDictionaryAsync(c => c.Id, c => c.Name, cancellationToken);

        // 6. Category Breakdown
        var categoryData = await _context.StockItems
            .GroupBy(i => i.CategoryId)
            .Select(g => new
            {
                CategoryId = g.Key,
                ItemCount = g.Count(),
                TotalQuantity = g.SelectMany(i => i.Lots)
                                 .Where(l => !(l.ExpiryDate != null && l.ExpiryDate.Value.Date <= today))
                                 .Sum(l => l.CurrentQuantity.Value)
            })
            .ToListAsync(cancellationToken);

        var categoryBreakdown = categoryData.Select(g => new CategoryStockDto
        {
            Category = categories.ContainsKey(g.CategoryId) ? categories[g.CategoryId] : "Inconnue",
            ItemCount = g.ItemCount,
            TotalQuantity = g.TotalQuantity
        }).ToList();

        var summary = new StockSummaryDto
        {
            TotalItems = totalItems,
            ActiveItems = activeItems,
            LowStockCount = lowStockCount,
            ExpiringCount = expiringCount,
            ExpiredCount = expiredCount,
            TotalWarehouses = totalWarehouses,
            UnreadAlerts = unreadAlerts,
            CategoryBreakdown = categoryBreakdown
        };

        return Result<StockSummaryDto>.Success(summary);
    }
}
