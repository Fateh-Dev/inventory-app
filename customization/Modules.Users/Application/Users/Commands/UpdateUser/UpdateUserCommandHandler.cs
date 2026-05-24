using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Users.Application.DTOs;
using Modules.Users.Infrastructure.Persistence;
using Modules.Users.Infrastructure.Security;
using SharedKernel;

namespace Modules.Users.Application.Users.Commands.UpdateUser;

public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, Result<UserDto>>
{
    private readonly UsersDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public UpdateUserCommandHandler(UsersDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result<UserDto>> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { request.Id }, cancellationToken);
        if (user == null)
        {
            return Result<UserDto>.Failure(Error.NotFound("User.NotFound", $"User with ID {request.Id} was not found."));
        }

        var emailExists = await _context.Users
            .AnyAsync(u => u.Id != request.Id && u.Email.ToLower() == request.Email.ToLower(), cancellationToken);
        if (emailExists)
        {
            return Result<UserDto>.Failure(Error.Conflict("User.EmailConflict", "Email is already in use."));
        }

        if (user.Username.Equals("admin", System.StringComparison.OrdinalIgnoreCase) && request.Role != Domain.Enums.UserRole.Admin)
        {
            return Result<UserDto>.Failure(Error.Validation("User.AdminRoleChangeNotAllowed", "The role of the default admin user cannot be changed."));
        }

        user.Update(request.Email, request.FullName, request.Role);

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            var newHash = _passwordHasher.HashPassword(request.Password);
            user.ChangePassword(newHash);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<UserDto>.Success(user.ToDto());
    }
}
