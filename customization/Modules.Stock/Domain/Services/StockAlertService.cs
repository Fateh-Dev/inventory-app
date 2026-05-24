using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Domain.Entities;
using Modules.Stock.Domain.Enums;
using Modules.Stock.Infrastructure.Persistence;

namespace Modules.Stock.Domain.Services;

public class StockAlertService : IStockAlertService
{
    private readonly StockDbContext _context;

    public StockAlertService(StockDbContext context)
    {
        _context = context;
    }

    public async Task CheckAndCreateAlertsAsync(StockItem item, CancellationToken ct = default)
    {
        // Check for Low Stock
        if (item.IsLowStock)
        {
            var exists = await _context.StockAlerts
                .AnyAsync(a => a.StockItemId == item.Id && a.AlertType == "LOW_STOCK" && !a.IsResolved, ct);

            if (!exists)
            {
                var message = $"Low stock alert for {item.Reference}. Total quantity is {item.TotalQuantity}, below threshold of {item.DefaultLowStockThreshold}.";
                var alert = StockAlert.Create(item.Id, null, AlertSeverity.Warning, message, "LOW_STOCK");
                _context.StockAlerts.Add(alert);
            }
        }

        // Check for Expiry
        foreach (var lot in item.Lots)
        {
            if (!lot.ExpiryDate.HasValue) continue;

            if (lot.IsExpired)
            {
                var exists = await _context.StockAlerts
                    .AnyAsync(a => a.StockItemId == item.Id && a.AlertType == "EXPIRED" && a.Message.Contains(lot.LotNumber.Value) && !a.IsResolved, ct);

                if (!exists)
                {
                    var message = $"Lot {lot.LotNumber.Value} has EXPIRED on {lot.ExpiryDate:d}.";
                    var alert = StockAlert.Create(item.Id, lot.WarehouseId, AlertSeverity.Critical, message, "EXPIRED");
                    _context.StockAlerts.Add(alert);
                }
            }
            else if (lot.ExpiryDate.Value <= DateTime.UtcNow.AddDays(30))
            {
                var exists = await _context.StockAlerts
                    .AnyAsync(a => a.StockItemId == item.Id && a.AlertType == "EXPIRING_SOON" && a.Message.Contains(lot.LotNumber.Value) && !a.IsResolved, ct);

                if (!exists)
                {
                    var message = $"Lot {lot.LotNumber.Value} is expiring soon on {lot.ExpiryDate:d}.";
                    var alert = StockAlert.Create(item.Id, lot.WarehouseId, AlertSeverity.Warning, message, "EXPIRING_SOON");
                    _context.StockAlerts.Add(alert);
                }
            }
        }
    }
}
