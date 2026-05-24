using System;
using MediatR;
using Modules.Users.Application.DTOs;
using SharedKernel;

namespace Modules.Users.Application.Users.Commands.UpdateProfile;

public record UpdateProfileCommand(Guid Id, string Email, string FullName) : IRequest<Result<UserDto>>;
