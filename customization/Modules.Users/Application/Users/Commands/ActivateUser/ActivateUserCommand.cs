using System;
using MediatR;
using SharedKernel;

namespace Modules.Users.Application.Users.Commands.ActivateUser;

public record ActivateUserCommand(Guid Id) : IRequest<Result>;
