using System;
using MediatR;
using SharedKernel;

namespace Modules.Users.Application.Users.Commands.ChangePassword;

public record ChangePasswordCommand(Guid Id, string CurrentPassword, string NewPassword) : IRequest<Result>;
