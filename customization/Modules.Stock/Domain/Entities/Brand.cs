using System;
using SharedKernel;

namespace Modules.Stock.Domain.Entities;

public class Brand : AggregateRoot
{
    public string Name { get; private set; }
    public bool IsActive { get; private set; }

    private Brand() { }

    private Brand(string name)
    {
        Id = Guid.NewGuid();
        Name = name;
        IsActive = true;
    }

    public static Brand Create(string name) => new Brand(name);

    public void Update(string name)
    {
        Name = name;
    }

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
}
