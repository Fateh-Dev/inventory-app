using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Infrastructure.Persistence;

var options = new DbContextOptionsBuilder<StockDbContext>()
    .UseNpgsql("Host=localhost;Database=FthDb;Username=postgres;Password=postgres")
    .Options;

using var context = new StockDbContext(options);

var movements = context.StockMovements.Include(m => m.Lines).ToList();
Console.WriteLine($"Movements count: {movements.Count}");

var itemIds = movements.SelectMany(m => m.Lines).Select(l => l.StockItemId).Distinct().ToList();
Console.WriteLine($"Item IDs count: {itemIds.Count}");
foreach(var id in itemIds) Console.WriteLine(id);

var stockItems = context.StockItems.Where(i => itemIds.Contains(i.Id)).ToList();
Console.WriteLine($"StockItems found: {stockItems.Count}");
foreach(var item in stockItems) Console.WriteLine($"{item.Id} - {item.Name}");
