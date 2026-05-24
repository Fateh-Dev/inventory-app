using System;
using Modules.Stock.Domain.Events;
using Modules.Stock.Domain.ValueObjects;
using SharedKernel;

namespace Modules.Stock.Domain.Entities;

public class Warehouse : AggregateRoot
{
    public string Name { get; private set; }
    public string Code { get; private set; }
    public Address Location { get; private set; }
    public string? Description { get; private set; }
    public bool IsActive { get; private set; } = true;
    public string ResponsiblePerson { get; private set; }

    private Warehouse() { } // EF Core

    private Warehouse(string name, string code, Address location, string responsiblePerson)
    {
        Id = Guid.NewGuid();
        Name = name;
        Code = code;
        Location = location;
        ResponsiblePerson = responsiblePerson;
        IsActive = true;
        
        Raise(new WarehouseCreatedDomainEvent(Id, Name, Code, DateTime.UtcNow));
    }

    public static Warehouse Create(string name, string code, Address location, string responsiblePerson)
    {
        return new Warehouse(name, code, location, responsiblePerson);
    }

    public void Update(string name, string code, Address location, string responsiblePerson, string? description)
    {
        Name = name;
        Code = code;
        Location = location;
        ResponsiblePerson = responsiblePerson;
        Description = description;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    public void Activate()
    {
        IsActive = true;
    }
}
