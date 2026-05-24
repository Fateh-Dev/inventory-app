using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Modules.Users.Infrastructure.Persistence;
using Modules.Users.Infrastructure.Security;
using SharedKernel;

namespace Modules.Users.Infrastructure;

public class UsersModuleInstaller : IModuleInstaller
{
    public void Install(IServiceCollection services, IConfiguration configuration)
    {
        var dbProvider = configuration["DatabaseProvider"];
        var connectionString = dbProvider == "postgres" 
            ? configuration.GetConnectionString("Postgres") 
            : configuration.GetConnectionString("Sqlite");

        services.AddDbContext<UsersDbContext>(options =>
        {
            if (dbProvider == "postgres")
            {
                options.UseNpgsql(connectionString, x => x.MigrationsHistoryTable("__EFMigrationsHistory", "identity"));
            }
            else
            {
                options.UseSqlite(connectionString);
            }
        });

        // Register MediatR
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(UsersModuleInstaller).Assembly));

        // Register Services
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<ITokenService, TokenService>();
    }
}
