using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Users.Application.DTOs;
using Modules.Users.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Users.Application.Users.Commands.UpdateProfile;

public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, Result<UserDto>>
{
    private readonly UsersDbContext _context;

    public UpdateProfileCommandHandler(UsersDbContext context)
    {
        _context = context;
    }

    public async Task<Result<UserDto>> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.Id }, cancellationToken);
        if (user == null)
        {
            return Result<UserDto>.Failure(Error.NotFound("User.NotFound", "User not found."));
        }

        var emailExists = await _context.Users
            .AnyAsync(u => u.Id != request.Id && u.Email.ToLower() == request.Email.ToLower(), cancellationToken);
        if (emailExists)
        {
            return Result<UserDto>.Failure(Error.Conflict("User.EmailConflict", "Email is already in use."));
        }

        user.UpdateProfile(request.Email, request.FullName);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<UserDto>.Success(user.ToDto());
    }
}
