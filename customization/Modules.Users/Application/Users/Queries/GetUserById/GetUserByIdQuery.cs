using System;
using MediatR;
using Modules.Users.Application.DTOs;
using SharedKernel;

namespace Modules.Users.Application.Users.Queries.GetUserById;

public record GetUserByIdQuery(Guid Id) : IRequest<Result<UserDto>>;
