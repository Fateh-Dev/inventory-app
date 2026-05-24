using System;
using Modules.Stock.Domain.Enums;
using SharedKernel;

namespace Modules.Stock.Domain.Events;

public sealed record StockItemCreatedDomainEvent(Guid StockItemId, string Reference, string Name, Guid CategoryId, DateTime OccurredAt) : IDomainEvent;
