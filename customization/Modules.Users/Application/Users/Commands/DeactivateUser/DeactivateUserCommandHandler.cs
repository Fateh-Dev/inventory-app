using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Modules.Users.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Users.Application.Users.Commands.DeactivateUser;

public class DeactivateUserCommandHandler : IRequestHandler<DeactivateUserCommand, Result>
{
    private readonly UsersDbContext _context;

    public DeactivateUserCommandHandler(UsersDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeactivateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.Id }, cancellationToken);
        if (user == null)
        {
            return Result.Failure(Error.NotFound("User.NotFound", "User not found."));
        }

        if (user.Username.Equals("admin", System.StringComparison.OrdinalIgnoreCase))
        {
            return Result.Failure(Error.Validation("User.AdminDeactivationNotAllowed", "The default admin user cannot be deactivated."));
        }

        user.Deactivate();
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
