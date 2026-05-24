using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Modules.Users.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Users.Application.Users.Commands.ActivateUser;

public class ActivateUserCommandHandler : IRequestHandler<ActivateUserCommand, Result>
{
    private readonly UsersDbContext _context;

    public ActivateUserCommandHandler(UsersDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(ActivateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.Id }, cancellationToken);
        if (user == null)
        {
            return Result.Failure(Error.NotFound("User.NotFound", "User not found."));
        }

        user.Activate();
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
