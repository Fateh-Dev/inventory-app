using MediatR;
using Modules.Users.Application.DTOs;
using SharedKernel;

namespace Modules.Users.Application.Users.Commands.LoginUser;

public record LoginUserCommand(string Username, string Password) : IRequest<Result<LoginResponse>>;
