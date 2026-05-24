using System.Collections.Generic;
using MediatR;
using Modules.Users.Application.DTOs;
using SharedKernel;

namespace Modules.Users.Application.Users.Queries.GetAllUsers;

public record GetAllUsersQuery : IRequest<Result<IEnumerable<UserDto>>>;
