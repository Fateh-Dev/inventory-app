using System;
using MediatR;
using Modules.Users.Application.DTOs;
using Modules.Users.Domain.Enums;
using SharedKernel;

namespace Modules.Users.Application.Users.Commands.UpdateUser;

public record UpdateUserCommand(
    Guid Id,
    string Email,
    string FullName,
    UserRole Role,
    string? Password = null
) : IRequest<Result<UserDto>>;
