using System;
using SharedKernel;

namespace Modules.Stock.Domain.Events;

public sealed record SupplierCreatedDomainEvent(Guid SupplierId, string Name, DateTime OccurredAt) : IDomainEvent;
