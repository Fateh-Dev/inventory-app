using System;
using Modules.Stock.Domain.Events;
using Modules.Stock.Domain.ValueObjects;
using SharedKernel;

namespace Modules.Stock.Domain.Entities;

public class Supplier : AggregateRoot
{
    public string Name { get; private set; }
    public string ContactPerson { get; private set; }
    public string Phone { get; private set; }
    public string Email { get; private set; }
    public Address Address { get; private set; }
    public bool IsActive { get; private set; } = true;
    public string? Notes { get; private set; }

    private Supplier() { } // EF Core

    private Supplier(string name, string contactPerson, string phone, string email, Address address, string? notes)
    {
        Id = Guid.NewGuid();
        Name = name;
        ContactPerson = contactPerson;
        Phone = phone;
        Email = email;
        Address = address;
        Notes = notes;
        IsActive = true;
        
        Raise(new SupplierCreatedDomainEvent(Id, Name, DateTime.UtcNow));
    }

    public static Supplier Create(string name, string contactPerson, string phone, string email, Address address, string? notes = null)
    {
        return new Supplier(name, contactPerson, phone, email, address, notes);
    }

    public void Update(string name, string contactPerson, string phone, string email, Address address, string? notes)
    {
        Name = name;
        ContactPerson = contactPerson;
        Phone = phone;
        Email = email;
        Address = address;
        Notes = notes;
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
