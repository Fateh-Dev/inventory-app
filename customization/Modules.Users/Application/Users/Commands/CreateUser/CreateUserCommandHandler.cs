using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Users.Application.DTOs;
using Modules.Users.Domain.Entities;
using Modules.Users.Infrastructure.Persistence;
using Modules.Users.Infrastructure.Security;
using SharedKernel;

namespace Modules.Users.Application.Users.Commands.CreateUser;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, Result<UserDto>>
{
    private readonly UsersDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public CreateUserCommandHandler(UsersDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result<UserDto>> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username))
        {
            return Result<UserDto>.Failure(Error.Validation("User.UsernameRequired", "Username is required."));
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return Result<UserDto>.Failure(Error.Validation("User.EmailRequired", "Email is required."));
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return Result<UserDto>.Failure(Error.Validation("User.PasswordRequired", "Password is required."));
        }

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return Result<UserDto>.Failure(Error.Validation("User.FullNameRequired", "Full name is required."));
        }

        var usernameExists = await _context.Users.AnyAsync(u => u.Username.ToLower() == request.Username.ToLower(), cancellationToken);
        if (usernameExists)
        {
            return Result<UserDto>.Failure(Error.Conflict("User.UsernameConflict", "Username is already in use."));
        }

        var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);
        if (emailExists)
        {
            return Result<UserDto>.Failure(Error.Conflict("User.EmailConflict", "Email is already in use."));
        }

        var passwordHash = _passwordHasher.HashPassword(request.Password);
        var user = User.Create(
            request.Username,
            request.Email,
            passwordHash,
            request.FullName,
            request.Role
        );

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<UserDto>.Success(user.ToDto());
    }
}
