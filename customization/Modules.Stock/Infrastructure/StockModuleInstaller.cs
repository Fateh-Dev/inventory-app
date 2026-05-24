using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Infrastructure;

public class StockModuleInstaller : IModuleInstaller
{
    public void Install(IServiceCollection services, IConfiguration configuration)
    {
        var dbProvider = configuration["DatabaseProvider"];
        var connectionString = dbProvider == "postgres" 
            ? configuration.GetConnectionString("Postgres") 
            : configuration.GetConnectionString("Sqlite");

        services.AddDbContext<StockDbContext>(options =>
        {
            if (dbProvider == "postgres")
            {
                options.UseNpgsql(connectionString, x => x.MigrationsHistoryTable("__EFMigrationsHistory", "stock"));
            }
            else
            {
                options.UseSqlite(connectionString);
            }
        });

        // Register MediatR
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(StockModuleInstaller).Assembly));

        // Register Domain Services
        services.AddScoped<Modules.Stock.Domain.Services.IMovementNumberGenerator, Modules.Stock.Domain.Services.MovementNumberGenerator>();
        services.AddScoped<Modules.Stock.Domain.Services.IStockAlertService, Modules.Stock.Domain.Services.StockAlertService>();
    }
}
