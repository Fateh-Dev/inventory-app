using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Domain.Entities;
using Modules.Stock.Domain.Enums;
using Modules.Stock.Domain.ValueObjects;
using Modules.Stock.Infrastructure.Persistence;

namespace Modules.Stock.Infrastructure;

public static class DbSeeder
{
    public static async Task SeedAsync(StockDbContext context)
    {
        // 0. Seed Categories
        if (!await context.Categories.AnyAsync())
        {
            context.Categories.AddRange(
                Category.Create("Peinture", "PAINT"),
                Category.Create("Mobilier", "FURN"),
                Category.Create("Électricité", "ELEC"),
                Category.Create("Plomberie", "PLUMB"),
                Category.Create("Outillage", "TOOLS"),
                Category.Create("Sécurité", "SAFE")
            );
            await context.SaveChangesAsync();
        }

        var catPaint = await context.Categories.FirstAsync(c => c.Name == "Peinture");
        var catTools = await context.Categories.FirstAsync(c => c.Name == "Outillage");
        var catFurn = await context.Categories.FirstAsync(c => c.Name == "Mobilier");

        // 1. Seed Brands & Models
        if (!await context.Brands.AnyAsync())
        {
            var b1 = Brand.Create("Astral");
            var b2 = Brand.Create("National Paints");
            var b3 = Brand.Create("Bosch");
            var b4 = Brand.Create("Schneider Electric");
            var b5 = Brand.Create("Ikea Pro");
            
            context.Brands.AddRange(b1, b2, b3, b4, b5);
            await context.SaveChangesAsync();

            context.BrandModels.AddRange(
                BrandModel.Create(b1.Id, "Astral Gloss"),
                BrandModel.Create(b1.Id, "Astral Matt"),
                BrandModel.Create(b2.Id, "WeatherShield"),
                BrandModel.Create(b3.Id, "GSR 18V-50"),
                BrandModel.Create(b3.Id, "GBH 2-26"),
                BrandModel.Create(b4.Id, "Acti9 iC60"),
                BrandModel.Create(b5.Id, "MARKUS"),
                BrandModel.Create(b5.Id, "BEKANT")
            );
            await context.SaveChangesAsync();
        }

        var brandAstral = await context.Brands.FirstAsync(b => b.Name == "Astral");
        var brandBosch = await context.Brands.FirstAsync(b => b.Name == "Bosch");
        var modelMarkus = await context.BrandModels.FirstAsync(m => m.Name == "MARKUS");

        // 2. Seed Suppliers
        if (!await context.Suppliers.AnyAsync())
        {
            context.Suppliers.AddRange(
                Supplier.Create("SARL Peintures Nationales", "Ahmed Benali", "021 55 44 33", "contact@national-peintures.dz", Address.Create("Zone Industrielle", "Alger", "Alger", "16000")),
                Supplier.Create("EURL Mobilier Pro", "Karima Mansouri", "031 22 88 99", "ventes@mobilier-pro.dz", Address.Create("Rue des Jardins", "Oran", "Oran", "31000")),
                Supplier.Create("Brico-Bat Algérie", "Yacine Toumi", "023 10 20 30", "info@bricobat.dz", Address.Create("Cité des Affaires", "Bab Ezzouar", "Alger", "16011"))
            );
            await context.SaveChangesAsync();
        }

        var sNational = await context.Suppliers.FirstAsync(s => s.Name.Contains("Nationales"));

        // 3. Seed Warehouses
        if (!await context.Warehouses.AnyAsync())
        {
            context.Warehouses.AddRange(
                Warehouse.Create("Entrepôt Central - Alger", "WH-ALG-01", Address.Create("Route de Dar El Beida", "Alger", "Alger", "16000"), "Saïd Brahimi"),
                Warehouse.Create("Dépôt Secondaire - Oran", "WH-ORN-01", Address.Create("Es-Senia", "Oran", "Oran", "31000"), "Mohamed Ziane")
            );
            await context.SaveChangesAsync();
        }

        var wAlger = await context.Warehouses.FirstAsync(w => w.Code == "WH-ALG-01");

        // 4. Seed Departments
        if (!await context.Departments.AnyAsync())
        {
            context.Departments.AddRange(
                Department.Create("Maintenance", "MAINT"),
                Department.Create("Logistique", "LOG"),
                Department.Create("Production", "PROD"),
                Department.Create("Administration", "ADMIN")
            );
            await context.SaveChangesAsync();
        }

        // 5. Seed Stock Items & Lots
        if (!await context.StockItems.AnyAsync())
        {
            var paint1 = StockItem.Create("PNT-EXT-W-20L", "Peinture Blanche Extérieure (20L)", "Peinture haute qualité pour façades", catPaint.Id, UnitOfMeasure.Can, true, false, 15, sNational.Id, brandAstral.Id, null);
            var tool1 = StockItem.Create("TOOL-DRL-HD-18V", "Perceuse à percussion 18V", "Perceuse professionnelle sans fil", catTools.Id, UnitOfMeasure.Set, false, true, 5, null, brandBosch.Id, null);
            var furn1 = StockItem.Create("FURN-CH-OFF-B3", "Chaise de Bureau Ergonomique B3", "Chaise pivotante confortable", catFurn.Id, UnitOfMeasure.Piece, false, true, 10, null, null, modelMarkus.Id);

            context.StockItems.AddRange(paint1, tool1, furn1);
            await context.SaveChangesAsync();

            context.StockLots.Add(StockLot.Create(paint1.Id, wAlger.Id, LotNumber.Create("L-PNT-001"), Quantity.Create(45, UnitOfMeasure.Can), MoneyAmount.Create(8500, "DZD"), DateTime.UtcNow.AddMonths(18), 15, null));
            await context.SaveChangesAsync();
        }
    }

    public static async Task SeedLargeDataAsync(StockDbContext context)
    {
        Console.WriteLine("Starting large seeding of 100,000 articles and movements...");
        
        // Disable Change Tracking auto-detection to optimize performance
        context.ChangeTracker.AutoDetectChangesEnabled = false;

        // Fetch needed reference records
        var categories = await context.Categories.ToListAsync();
        var warehouses = await context.Warehouses.ToListAsync();
        var suppliers = await context.Suppliers.ToListAsync();
        var departments = await context.Departments.ToListAsync();

        if (!categories.Any() || !warehouses.Any() || !suppliers.Any())
        {
            Console.WriteLine("Basic reference data must be seeded before running large scale seeding.");
            return;
        }

        var catId = categories[0].Id;
        var whId = warehouses[0].Id;
        var supId = suppliers[0].Id;

        var rand = new Random(42);
        var units = Enum.GetValues<UnitOfMeasure>();

        int totalRecords = 100000;
        int batchSize = 5000;

        for (int i = 0; i < totalRecords; i += batchSize)
        {
            int currentBatchSize = Math.Min(batchSize, totalRecords - i);
            
            var stockItems = new System.Collections.Generic.List<StockItem>();
            var stockLots = new System.Collections.Generic.List<StockLot>();
            var movements = new System.Collections.Generic.List<StockMovement>();

            for (int j = 0; j < currentBatchSize; j++)
            {
                int index = i + j;
                var reference = $"ART-{index:D6}";
                var name = $"Article Material #{index}";
                var unit = units[index % units.Length];
                
                var item = StockItem.Create(
                    reference,
                    name,
                    $"Bulk seeded test article number {index}",
                    catId,
                    unit,
                    false, // hasExpiryDate
                    false, // requiresSerialNumber
                    5,     // defaultLowStockThreshold
                    supId
                );
                stockItems.Add(item);

                var lot = StockLot.Create(
                    item.Id,
                    whId,
                    LotNumber.Create($"LOT-{index:D6}"),
                    Quantity.Create(rand.Next(10, 1000), unit),
                    MoneyAmount.Create(rand.Next(100, 10000), "DZD"),
                    null,
                    5,
                    null
                );
                stockLots.Add(lot);

                // Create a confirmed reception movement
                var movement = StockMovement.CreateReception(
                    $"MOV-SEED-{index:D6}",
                    whId,
                    supId,
                    DateTime.UtcNow.AddDays(-rand.Next(1, 365)),
                    "system",
                    $"REF-SEED-{index}",
                    "Bulk seeded test movement"
                );
                
                movement.AddLine(
                    item.Id,
                    lot.Id,
                    Quantity.Create(rand.Next(1, 10), unit),
                    MoneyAmount.Create(rand.Next(100, 5000), "DZD"),
                    null,
                    null,
                    "Seeded line"
                );
                
                // Confirm the movement so that its status in database becomes Confirmed
                movement.Confirm();
                movements.Add(movement);
            }

            // Save elements in batches
            context.StockItems.AddRange(stockItems);
            context.StockLots.AddRange(stockLots);
            context.StockMovements.AddRange(movements);

            await context.SaveChangesAsync();
            context.ChangeTracker.Clear(); // Critical to prevent memory leak / performance degradation

            Console.WriteLine($"Seeded {i + currentBatchSize} / {totalRecords} articles and movements...");
        }

        Console.WriteLine("Large seeding complete!");
    }
}
