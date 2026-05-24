using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Modules.Users.Application.DTOs;
using Modules.Users.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Users.Application.Users.Queries.GetUserById;

public class GetUserByIdQueryHandler : IRequestHandler<GetUserByIdQuery, Result<UserDto>>
{
    private readonly UsersDbContext _context;

    public GetUserByIdQueryHandler(UsersDbContext context)
    {
        _context = context;
    }

    public async Task<Result<UserDto>> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.Id }, cancellationToken);
        if (user == null)
        {
            return Result<UserDto>.Failure(Error.NotFound("User.NotFound", $"User with ID {request.Id} was not found."));
        }

        return Result<UserDto>.Success(user.ToDto());
    }
}
