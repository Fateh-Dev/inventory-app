using System;
using SharedKernel;

namespace Modules.Stock.Domain.Entities;

public class BrandModel : AggregateRoot
{
    public Guid BrandId { get; private set; }
    public string Name { get; private set; }
    public bool IsActive { get; private set; }

    private BrandModel() { }

    private BrandModel(Guid brandId, string name)
    {
        Id = Guid.NewGuid();
        BrandId = brandId;
        Name = name;
        IsActive = true;
    }

    public static BrandModel Create(Guid brandId, string name) => new BrandModel(brandId, name);

    public void Update(string name)
    {
        Name = name;
    }

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
}
