using System;
using System.Collections.Generic;
using System.Linq;
using Modules.Stock.Domain.Enums;
using Modules.Stock.Domain.Events;
using SharedKernel;

namespace Modules.Stock.Domain.Entities;

public class StockItem : AggregateRoot
{
    public string Reference { get; private set; }
    public string Name { get; private set; }
    public string? Description { get; private set; }
    public Guid CategoryId { get; private set; }
    public UnitOfMeasure DefaultUnit { get; private set; }
    public Guid? BrandId { get; private set; }
    public Guid? BrandModelId { get; private set; }
    public bool RequiresSerialNumber { get; private set; }
    public bool HasExpiryDate { get; private set; }
    public decimal DefaultLowStockThreshold { get; private set; }
    public bool IsActive { get; private set; }
    public Guid? DefaultSupplierId { get; private set; }

    public List<StockLot> Lots { get; private set; } = new();

    public decimal TotalQuantity => Lots.Where(l => !l.IsExpired).Sum(l => l.CurrentQuantity.Value);
    public bool IsLowStock => TotalQuantity <= DefaultLowStockThreshold;
    public int ExpiringLotCount => Lots.Count(l => l.ExpiryDate.HasValue && l.ExpiryDate.Value <= DateTime.UtcNow.AddDays(30) && !l.IsExpired);

    private StockItem() { }

    private StockItem(string reference, string name, string? description, Guid categoryId, UnitOfMeasure unit, bool hasExpiryDate, bool requiresSerial, decimal lowStockThreshold, Guid? defaultSupplierId, Guid? brandId, Guid? brandModelId)
    {
        Id = Guid.NewGuid();
        Reference = reference;
        Name = name;
        Description = description;
        CategoryId = categoryId;
        DefaultUnit = unit;
        HasExpiryDate = hasExpiryDate;
        RequiresSerialNumber = requiresSerial;
        DefaultLowStockThreshold = lowStockThreshold;
        DefaultSupplierId = defaultSupplierId;
        BrandId = brandId;
        BrandModelId = brandModelId;
        IsActive = true;

        Raise(new StockItemCreatedDomainEvent(Id, Reference, Name, CategoryId, DateTime.UtcNow));
    }

    public static StockItem Create(string reference, string name, string? description, Guid categoryId, UnitOfMeasure unit, bool hasExpiryDate, bool requiresSerial, decimal lowStockThreshold, Guid? defaultSupplierId, Guid? brandId = null, Guid? brandModelId = null)
    {
        return new StockItem(reference, name, description, categoryId, unit, hasExpiryDate, requiresSerial, lowStockThreshold, defaultSupplierId, brandId, brandModelId);
    }

    public void Update(string name, string? description, Guid categoryId, UnitOfMeasure unit, Guid? brandId, Guid? brandModelId, bool requiresSerial, bool hasExpiryDate, decimal lowStockThreshold, Guid? defaultSupplierId)
    {
        Name = name;
        Description = description;
        CategoryId = categoryId;
        DefaultUnit = unit;
        BrandId = brandId;
        BrandModelId = brandModelId;
        RequiresSerialNumber = requiresSerial;
        HasExpiryDate = hasExpiryDate;
        DefaultLowStockThreshold = lowStockThreshold;
        DefaultSupplierId = defaultSupplierId;
    }

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
}
