using System;
using MediatR;
using SharedKernel;

namespace Modules.Users.Application.Users.Commands.DeactivateUser;

public record DeactivateUserCommand(Guid Id) : IRequest<Result>;
