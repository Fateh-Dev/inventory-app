using System;
using SharedKernel;

namespace Modules.Users.Domain.Events;

public sealed record UserCreatedDomainEvent(Guid UserId, string Username, string Email, DateTime OccurredAt) : IDomainEvent;
