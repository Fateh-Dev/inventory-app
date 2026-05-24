using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Modules.Users.Infrastructure.Persistence;
using Modules.Users.Infrastructure.Security;
using SharedKernel;

namespace Modules.Users.Application.Users.Commands.ChangePassword;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, Result>
{
    private readonly UsersDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public ChangePasswordCommandHandler(UsersDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.Id }, cancellationToken);
        if (user == null)
        {
            return Result.Failure(Error.NotFound("User.NotFound", "User not found."));
        }

        var isCurrentPasswordValid = _passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash);
        if (!isCurrentPasswordValid)
        {
            return Result.Failure(Error.Validation("User.InvalidCurrentPassword", "Current password is incorrect."));
        }

        var newHash = _passwordHasher.HashPassword(request.NewPassword);
        user.ChangePassword(newHash);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
