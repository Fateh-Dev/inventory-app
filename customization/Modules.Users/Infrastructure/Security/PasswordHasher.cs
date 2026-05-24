using System;
using System.Security.Cryptography;

namespace Modules.Users.Infrastructure.Security;

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string hashedPassword);
}

public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16; // 128 bit
    private const int KeySize = 32;  // 256 bit
    private const int Iterations = 10000;

    public string HashPassword(string password)
    {
        using var algorithm = new Rfc2898DeriveBytes(
            password,
            SaltSize,
            Iterations,
            HashAlgorithmName.SHA256);

        var key = algorithm.GetBytes(KeySize);
        var salt = algorithm.Salt;

        var bytes = new byte[SaltSize + KeySize];
        Array.Copy(salt, 0, bytes, 0, SaltSize);
        Array.Copy(key, 0, bytes, SaltSize, KeySize);

        return Convert.ToBase64String(bytes);
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        try
        {
            var bytes = Convert.ToBase64String(Guid.Empty.ToByteArray()); // Dummy try
            var decoded = Convert.FromBase64String(hashedPassword);
            if (decoded.Length != SaltSize + KeySize) return false;

            var salt = new byte[SaltSize];
            var key = new byte[KeySize];
            Array.Copy(decoded, 0, salt, 0, SaltSize);
            Array.Copy(decoded, SaltSize, key, 0, KeySize);

            using var algorithm = new Rfc2898DeriveBytes(
                password,
                salt,
                Iterations,
                HashAlgorithmName.SHA256);

            var testKey = algorithm.GetBytes(KeySize);

            // Time-constant comparison
            var result = 0;
            for (var i = 0; i < KeySize; i++)
            {
                result |= key[i] ^ testKey[i];
            }
            return result == 0;
        }
        catch
        {
            return false;
        }
    }
}
