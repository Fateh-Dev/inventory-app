using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Users.Application.DTOs;
using Modules.Users.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Users.Application.Users.Queries.GetAllUsers;

public class GetAllUsersQueryHandler : IRequestHandler<GetAllUsersQuery, Result<IEnumerable<UserDto>>>
{
    private readonly UsersDbContext _context;

    public GetAllUsersQueryHandler(UsersDbContext context)
    {
        _context = context;
    }

    public async Task<Result<IEnumerable<UserDto>>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await _context.Users
            .OrderBy(u => u.Username)
            .ToListAsync(cancellationToken);

        var dtos = users.Select(u => u.ToDto());
        return Result<IEnumerable<UserDto>>.Success(dtos);
    }
}
