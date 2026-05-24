using System;
using SharedKernel;

namespace Modules.Stock.Domain.Events;

public sealed record StockExpiryAlertDomainEvent(Guid StockItemId, Guid LotId, string LotNumber, DateTime ExpiryDate, DateTime OccurredAt) : IDomainEvent;
