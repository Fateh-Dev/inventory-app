using System;
using SharedKernel;

namespace Modules.Stock.Domain.Events;

public sealed record StockMovementCancelledDomainEvent(Guid MovementId, string MovementNumber, DateTime OccurredAt) : IDomainEvent;
