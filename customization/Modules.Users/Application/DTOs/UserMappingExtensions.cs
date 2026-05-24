using Modules.Users.Domain.Entities;

namespace Modules.Users.Application.DTOs;

public static class UserMappingExtensions
{
    public static UserDto ToDto(this User user)
    {
        return new UserDto(
            user.Id,
            user.Username,
            user.Email,
            user.FullName,
            user.Role.ToString(),
            user.IsActive,
            user.CreatedAt,
            user.UpdatedAt
        );
    }
}
