using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Modules.Stock.Domain.Entities;
using Modules.Stock.Domain.Enums;
using Modules.Stock.Domain.Events;
using Modules.Stock.Infrastructure.Persistence;

namespace Modules.Stock.Application.EventHandlers;

public class StockExpiryAlertEventHandler : INotificationHandler<StockExpiryAlertDomainEvent>
{
    private readonly StockDbContext _context;

    public StockExpiryAlertEventHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task Handle(StockExpiryAlertDomainEvent notification, CancellationToken cancellationToken)
    {
        var isAlreadyExpired = notification.ExpiryDate <= System.DateTime.UtcNow;
        var severity = isAlreadyExpired ? AlertSeverity.Critical : AlertSeverity.Warning;
        var type = isAlreadyExpired ? "EXPIRED" : "EXPIRING_SOON";
        var statusMsg = isAlreadyExpired ? "has expired" : "is expiring soon";

        var message = $"Lot {notification.LotNumber} {statusMsg} on {notification.ExpiryDate:d}.";

        var alert = StockAlert.Create(
            notification.StockItemId,
            null, // Could link to specific warehouse if needed
            severity,
            message,
            type
        );

        _context.StockAlerts.Add(alert);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
