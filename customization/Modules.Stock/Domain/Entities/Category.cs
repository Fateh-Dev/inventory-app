using System;
using SharedKernel;

namespace Modules.Stock.Domain.Entities;

public class Category : AggregateRoot
{
    public string Name { get; private set; }
    public string? Code { get; private set; }
    public bool IsActive { get; private set; }

    private Category() { }

    private Category(string name, string? code)
    {
        Id = Guid.NewGuid();
        Name = name;
        Code = code;
        IsActive = true;
    }

    public static Category Create(string name, string? code = null) => new Category(name, code);

    public void Update(string name, string? code)
    {
        Name = name;
        Code = code;
    }

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
}
