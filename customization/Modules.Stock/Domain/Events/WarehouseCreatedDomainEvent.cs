using System;
using SharedKernel;

namespace Modules.Stock.Domain.Events;

public sealed record WarehouseCreatedDomainEvent(Guid WarehouseId, string Name, string Code, DateTime OccurredAt) : IDomainEvent;
