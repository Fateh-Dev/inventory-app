using System;
using Modules.Users.Domain.Enums;
using Modules.Users.Domain.Events;
using SharedKernel;

namespace Modules.Users.Domain.Entities;

public class User : AggregateRoot
{
    public string Username { get; private set; }
    public string Email { get; private set; }
    public string PasswordHash { get; private set; }
    public string FullName { get; private set; }
    public UserRole Role { get; private set; }
    public bool IsActive { get; private set; }

    private User() { } // Required by EF Core

    private User(string username, string email, string passwordHash, string fullName, UserRole role)
    {
        Id = Guid.NewGuid();
        Username = username;
        Email = email;
        PasswordHash = passwordHash;
        FullName = fullName;
        Role = role;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
        
        Raise(new UserCreatedDomainEvent(Id, Username, Email, CreatedAt));
    }

    public static User Create(string username, string email, string passwordHash, string fullName, UserRole role)
    {
        if (string.IsNullOrWhiteSpace(username)) throw new ArgumentException("Username is required", nameof(username));
        if (string.IsNullOrWhiteSpace(email)) throw new ArgumentException("Email is required", nameof(email));
        if (string.IsNullOrWhiteSpace(passwordHash)) throw new ArgumentException("Password hash is required", nameof(passwordHash));
        if (string.IsNullOrWhiteSpace(fullName)) throw new ArgumentException("Full name is required", nameof(fullName));

        return new User(username, email, passwordHash, fullName, role);
    }

    public void Update(string email, string fullName, UserRole role)
    {
        if (string.IsNullOrWhiteSpace(email)) throw new ArgumentException("Email is required", nameof(email));
        if (string.IsNullOrWhiteSpace(fullName)) throw new ArgumentException("Full name is required", nameof(fullName));

        Email = email;
        FullName = fullName;
        Role = role;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateProfile(string email, string fullName)
    {
        if (string.IsNullOrWhiteSpace(email)) throw new ArgumentException("Email is required", nameof(email));
        if (string.IsNullOrWhiteSpace(fullName)) throw new ArgumentException("Full name is required", nameof(fullName));

        Email = email;
        FullName = fullName;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ChangePassword(string newPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash)) throw new ArgumentException("Password hash is required", nameof(newPasswordHash));

        PasswordHash = newPasswordHash;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }
}
