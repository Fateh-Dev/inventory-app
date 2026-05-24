using SharedKernel;
using Modules.Stock.Infrastructure;
using Modules.Stock.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddApplicationPart(typeof(Modules.Stock.Infrastructure.StockModuleInstaller).Assembly)
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Auto-discover and install all IModuleInstaller implementations
var installers = typeof(StockModuleInstaller).Assembly.ExportedTypes
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
app.MapControllers();

// Apply database schema and seed data on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<StockDbContext>();
    Console.WriteLine("Applying database initialization...");
    var deleted = dbContext.Database.EnsureDeleted(); 
    Console.WriteLine($"Database deleted: {deleted}");
    
    var created = dbContext.Database.EnsureCreated();
    Console.WriteLine($"Database created: {created}");
    
    Console.WriteLine("Seeding data...");
    await DbSeeder.SeedAsync(dbContext);
    Console.WriteLine("Initialization complete.");
}

app.Run();
