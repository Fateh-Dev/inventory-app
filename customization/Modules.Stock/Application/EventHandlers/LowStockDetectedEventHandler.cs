using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Modules.Stock.Domain.Entities;
using Modules.Stock.Domain.Enums;
using Modules.Stock.Domain.Events;
using Modules.Stock.Infrastructure.Persistence;

namespace Modules.Stock.Application.EventHandlers;

public class LowStockDetectedEventHandler : INotificationHandler<LowStockDetectedDomainEvent>
{
    private readonly StockDbContext _context;

    public LowStockDetectedEventHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task Handle(LowStockDetectedDomainEvent notification, CancellationToken cancellationToken)
    {
        var message = $"Low stock alert for {notification.Reference}. Current quantity: {notification.TotalQuantity}, Threshold: {notification.Threshold}";
        
        var alert = StockAlert.Create(
            notification.StockItemId,
            null, // Global alert across warehouses
            AlertSeverity.Warning,
            message,
            "LOW_STOCK"
        );

        _context.StockAlerts.Add(alert);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
