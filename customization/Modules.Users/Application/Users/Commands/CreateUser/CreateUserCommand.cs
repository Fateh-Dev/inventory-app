using MediatR;
using Modules.Users.Application.DTOs;
using Modules.Users.Domain.Enums;
using SharedKernel;

namespace Modules.Users.Application.Users.Commands.CreateUser;

public record CreateUserCommand(
    string Username,
    string Email,
    string Password,
    string FullName,
    UserRole Role
) : IRequest<Result<UserDto>>;
