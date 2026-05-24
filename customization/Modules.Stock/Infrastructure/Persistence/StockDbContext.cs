using Microsoft.EntityFrameworkCore;
using Modules.Stock.Domain.Entities;
using Modules.Stock.Domain.ValueObjects;

namespace Modules.Stock.Infrastructure.Persistence;

public class StockDbContext : DbContext
{
    public StockDbContext(DbContextOptions<StockDbContext> options) : base(options) { }

    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<StockItem> StockItems => Set<StockItem>();
    public DbSet<StockLot> StockLots => Set<StockLot>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<StockMovementLine> StockMovementLines => Set<StockMovementLine>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<BrandModel> BrandModels => Set<BrandModel>();
    public DbSet<StockAlert> StockAlerts => Set<StockAlert>();
    public DbSet<Department> Departments => Set<Department>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("stock");

        modelBuilder.Entity<Category>(entity => {
            entity.ToTable("Categories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Code).HasMaxLength(50);
        });

        modelBuilder.Entity<Brand>(entity => {
            entity.ToTable("Brands");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
        });

        modelBuilder.Entity<BrandModel>(entity => {
            entity.ToTable("BrandModels");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.HasOne<Brand>().WithMany().HasForeignKey(e => e.BrandId);
        });

        modelBuilder.Entity<Supplier>(entity => {
            entity.ToTable("Suppliers");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
            entity.Property(e => e.ContactPerson).HasMaxLength(100);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.OwnsOne(e => e.Address, a => {
                a.Property(x => x.Street).HasColumnName("Street").HasMaxLength(200);
                a.Property(x => x.City).HasColumnName("City").HasMaxLength(100);
                a.Property(x => x.Wilaya).HasColumnName("Wilaya").HasMaxLength(100);
                a.Property(x => x.PostalCode).HasColumnName("PostalCode").HasMaxLength(10);
            });
        });

        modelBuilder.Entity<Warehouse>(entity => {
            entity.ToTable("Warehouses");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(150);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(20);
            entity.Property(e => e.ResponsiblePerson).HasMaxLength(100);
            entity.OwnsOne(e => e.Location, a => {
                a.Property(x => x.Street).HasColumnName("Street").HasMaxLength(200);
                a.Property(x => x.City).HasColumnName("City").HasMaxLength(100);
                a.Property(x => x.Wilaya).HasColumnName("Wilaya").HasMaxLength(100);
                a.Property(x => x.PostalCode).HasColumnName("PostalCode").HasMaxLength(10);
            });
        });

        modelBuilder.Entity<StockItem>(entity => {
            entity.ToTable("StockItems");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Reference).IsUnique();
            entity.Property(e => e.Reference).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.CategoryId).IsRequired();
            entity.Property(e => e.DefaultUnit).HasConversion<string>().HasMaxLength(20);
            entity.Property(e => e.BrandId).IsRequired(false);
            entity.Property(e => e.BrandModelId).IsRequired(false);
            entity.Ignore(e => e.TotalQuantity);
            entity.Ignore(e => e.IsLowStock);
            entity.Ignore(e => e.ExpiringLotCount);
            entity.HasMany(e => e.Lots).WithOne().HasForeignKey(l => l.StockItemId);
            entity.HasOne<Category>().WithMany().HasForeignKey(e => e.CategoryId);
            entity.HasOne<Supplier>().WithMany().HasForeignKey(e => e.DefaultSupplierId).IsRequired(false);
            entity.HasOne<Brand>().WithMany().HasForeignKey(e => e.BrandId).IsRequired(false);
            entity.HasOne<BrandModel>().WithMany().HasForeignKey(e => e.BrandModelId).IsRequired(false);
        });

        modelBuilder.Entity<StockLot>(entity => {
            entity.ToTable("StockLots");
            entity.HasKey(e => e.Id);
            entity.OwnsOne(e => e.LotNumber, v => v.Property(x => x.Value).HasColumnName("LotNumber").HasMaxLength(50).IsRequired());
            entity.OwnsOne(e => e.CurrentQuantity, v => {
                v.Property(x => x.Value).HasColumnName("CurrentQuantityValue").HasPrecision(18, 4);
                v.Property(x => x.Unit).HasColumnName("CurrentQuantityUnit").HasConversion<string>().HasMaxLength(20);
            });
            entity.OwnsOne(e => e.InitialQuantity, v => {
                v.Property(x => x.Value).HasColumnName("InitialQuantityValue").HasPrecision(18, 4);
                v.Property(x => x.Unit).HasColumnName("InitialQuantityUnit").HasConversion<string>().HasMaxLength(20);
            });
            entity.OwnsOne(e => e.UnitCost, v => {
                v.Property(x => x.Amount).HasColumnName("UnitCostAmount").HasPrecision(18, 2);
                v.Property(x => x.Currency).HasColumnName("Currency").HasMaxLength(3);
            });
            entity.Property(e => e.SerialNumber).HasMaxLength(100);
            entity.Property(e => e.LowStockThreshold).HasPrecision(18, 4);
        });

        modelBuilder.Entity<Department>(entity => {
            entity.ToTable("Departments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Code).HasMaxLength(50);
        });

        modelBuilder.Entity<StockMovement>(entity => {
            entity.ToTable("StockMovements");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.MovementNumber).IsUnique();
            entity.Property(e => e.MovementNumber).IsRequired().HasMaxLength(30);
            entity.Property(e => e.Type).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.Reference).HasMaxLength(100);
            entity.Property(e => e.Notes).HasMaxLength(1000);
            entity.Property(e => e.CreatedByUser).HasMaxLength(100);
            entity.HasMany(e => e.Lines).WithOne().HasForeignKey(l => l.StockMovementId);
            entity.HasOne<Department>().WithMany().HasForeignKey(e => e.DepartmentId).IsRequired(false);
            entity.HasOne<Supplier>().WithMany().HasForeignKey(e => e.SupplierId).IsRequired(false);
            entity.HasOne<Warehouse>().WithMany().HasForeignKey(e => e.SourceWarehouseId).IsRequired(false);
            entity.HasOne<Warehouse>().WithMany().HasForeignKey(e => e.DestinationWarehouseId).IsRequired(false);
        });

        modelBuilder.Entity<StockMovementLine>(entity => {
            entity.ToTable("StockMovementLines");
            entity.HasKey(e => e.Id);
            entity.OwnsOne(e => e.Quantity, v => {
                v.Property(x => x.Value).HasColumnName("QuantityValue").HasPrecision(18, 4);
                v.Property(x => x.Unit).HasColumnName("QuantityUnit").HasConversion<string>().HasMaxLength(20);
            });
            entity.OwnsOne(e => e.UnitCost, v => {
                v.Property(x => x.Amount).HasColumnName("UnitCostAmount").HasPrecision(18, 2);
                v.Property(x => x.Currency).HasColumnName("Currency").HasMaxLength(3);
            });
            entity.Property(e => e.Notes).HasMaxLength(500);
        });

        modelBuilder.Entity<StockAlert>(entity => {
            entity.ToTable("StockAlerts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Severity).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.Message).HasMaxLength(500);
            entity.Property(e => e.AlertType).HasMaxLength(50);
            entity.Property(e => e.Resolution).HasMaxLength(500);
        });

        base.OnModelCreating(modelBuilder);
    }
}
