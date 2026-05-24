using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.Extensions.Logging;
using Modules.Stock.Domain.Events;

namespace Modules.Stock.Application.EventHandlers;

public class StockMovementConfirmedEventHandler : INotificationHandler<StockMovementConfirmedDomainEvent>
{
    private readonly ILogger<StockMovementConfirmedEventHandler> _logger;

    public StockMovementConfirmedEventHandler(ILogger<StockMovementConfirmedEventHandler> logger)
    {
        _logger = logger;
    }

    public Task Handle(StockMovementConfirmedDomainEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Stock movement confirmed: {MovementId} - {MovementNumber} of type {Type} at {OccurredAt}", 
            notification.MovementId, 
            notification.MovementNumber, 
            notification.Type, 
            notification.OccurredAt);

        // Additional asynchronous logic can be placed here
        return Task.CompletedTask;
    }
}
