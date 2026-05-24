using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Users.Application.DTOs;
using Modules.Users.Infrastructure.Persistence;
using Modules.Users.Infrastructure.Security;
using SharedKernel;

namespace Modules.Users.Application.Users.Commands.LoginUser;

public class LoginUserCommandHandler : IRequestHandler<LoginUserCommand, Result<LoginResponse>>
{
    private readonly UsersDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public LoginUserCommandHandler(
        UsersDbContext context,
        IPasswordHasher passwordHasher,
        ITokenService tokenService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<Result<LoginResponse>> Handle(LoginUserCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Result<LoginResponse>.Failure(Error.Validation("Login.Validation", "Username and Password are required."));
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower(), cancellationToken);

        if (user == null)
        {
            return Result<LoginResponse>.Failure(Error.NotFound("Login.InvalidCredentials", "Invalid username or password."));
        }

        if (!user.IsActive)
        {
            return Result<LoginResponse>.Failure(Error.Validation("Login.InactiveUser", "User account is inactive."));
        }

        var isPasswordValid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            return Result<LoginResponse>.Failure(Error.NotFound("Login.InvalidCredentials", "Invalid username or password."));
        }

        var token = _tokenService.GenerateToken(user);
        var response = new LoginResponse(token, user.ToDto());

        return Result<LoginResponse>.Success(response);
    }
}
