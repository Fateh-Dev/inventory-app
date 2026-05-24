using System;
using SharedKernel;

namespace Modules.Stock.Domain.Events;

public sealed record LowStockDetectedDomainEvent(Guid StockItemId, string Reference, decimal TotalQuantity, decimal Threshold, DateTime OccurredAt) : IDomainEvent;
