using System;
using Modules.Stock.Domain.Enums;
using SharedKernel;

namespace Modules.Stock.Domain.Events;

public sealed record StockMovementConfirmedDomainEvent(Guid MovementId, string MovementNumber, StockMovementType Type, DateTime OccurredAt) : IDomainEvent;
