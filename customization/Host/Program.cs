using SharedKernel;
using Modules.Stock.Infrastructure;
using Modules.Stock.Infrastructure.Persistence;
using Modules.Users.Infrastructure;
using Modules.Users.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddApplicationPart(typeof(StockModuleInstaller).Assembly)
    .AddApplicationPart(typeof(UsersModuleInstaller).Assembly)
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();

// Configure JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "SuperSecretKeyForJWTTokenGeneration1234567890!@"))
    };
});

builder.Services.AddAuthorization();

// Configure Swagger with JWT support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "FTH Stock API", Version = "v1" });
    
    var securityScheme = new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "JWT Authentication",
        Description = "Enter your JWT token in this format: Bearer {your_token_here}",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new Microsoft.OpenApi.Models.OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme
        }
    };
    c.AddSecurityDefinition(securityScheme.Reference.Id, securityScheme);
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        { securityScheme, Array.Empty<string>() }
    });
});

// Auto-discover and install IModuleInstaller implementations from both modules
var assemblies = new[]
{
    typeof(StockModuleInstaller).Assembly,
    typeof(UsersModuleInstaller).Assembly
};

var installers = assemblies
    .SelectMany(x => x.ExportedTypes)
    .Where(x => typeof(IModuleInstaller).IsAssignableFrom(x) && !x.IsInterface && !x.IsAbstract)
    .Select(Activator.CreateInstance).Cast<IModuleInstaller>().ToList();

foreach (var installer in installers)
{
    installer.Install(builder.Services, builder.Configuration);
}

// CORS — allow Angular dev server
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://localhost:4201")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Apply database schema and seed data on startup
using (var scope = app.Services.CreateScope())
{
    var stockDb = scope.ServiceProvider.GetRequiredService<StockDbContext>();
    var usersDb = scope.ServiceProvider.GetRequiredService<UsersDbContext>();
    
    Console.WriteLine("Applying database initialization...");
    var resetDb = app.Configuration.GetValue<bool>("ResetDatabaseOnStartup", false);
    bool stockCreated = false;
    
    if (resetDb)
    {
        var deleted = stockDb.Database.EnsureDeleted(); 
        Console.WriteLine($"Database deleted: {deleted}");
        stockCreated = stockDb.Database.EnsureCreated();
        Console.WriteLine($"Stock Database created: {stockCreated}");
    }
    else
    {
        stockCreated = stockDb.Database.EnsureCreated();
        Console.WriteLine($"Stock Database created: {stockCreated}");
    }
    
    // Since both DbContexts share the same database, EnsureCreated on stockDb creates the database.
    // We must use RelationalDatabaseCreator to create tables for usersDb if the database was just created.
    if (stockCreated)
    {
        var databaseCreator = usersDb.Database.GetService<IDatabaseCreator>() as IRelationalDatabaseCreator;
        if (databaseCreator != null)
        {
            try
            {
                databaseCreator.CreateTables();
                Console.WriteLine("Users database tables created.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Note: Users tables might already exist: {ex.Message}");
            }
        }
    }
    
    // Seed stock data if database was just created or is completely empty
    var shouldSeedStock = stockCreated || !await stockDb.StockItems.AnyAsync();
    if (shouldSeedStock)
    {
        Console.WriteLine("Seeding Stock data...");
        await DbSeeder.SeedAsync(stockDb);
        
        var seedLarge = app.Configuration.GetValue<bool>("SeedLargeData", false);
        if (seedLarge)
        {
            await DbSeeder.SeedLargeDataAsync(stockDb);
        }
    }
    
    // Seed user data if users table is empty
    var shouldSeedUsers = stockCreated || !await usersDb.Users.AnyAsync();
    if (shouldSeedUsers)
    {
        Console.WriteLine("Seeding User data...");
        var passwordHasher = scope.ServiceProvider.GetRequiredService<Modules.Users.Infrastructure.Security.IPasswordHasher>();
        var adminUser = Modules.Users.Domain.Entities.User.Create(
            "admin",
            "admin@fth.dz",
            passwordHasher.HashPassword("AdminPassword123!"),
            "Fateh Admin",
            Modules.Users.Domain.Enums.UserRole.Admin
        );
        var managerUser = Modules.Users.Domain.Entities.User.Create(
            "manager",
            "manager@fth.dz",
            passwordHasher.HashPassword("ManagerPassword123!"),
            "Fateh Manager",
            Modules.Users.Domain.Enums.UserRole.Manager
        );
        var workerUser = Modules.Users.Domain.Entities.User.Create(
            "worker",
            "worker@fth.dz",
            passwordHasher.HashPassword("WorkerPassword123!"),
            "Fateh Worker",
            Modules.Users.Domain.Enums.UserRole.Worker
        );

        usersDb.Users.AddRange(adminUser, managerUser, workerUser);
        await usersDb.SaveChangesAsync();
    }
    
    Console.WriteLine("Initialization complete.");
}

app.Run();
