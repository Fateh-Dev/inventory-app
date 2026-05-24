using System.Collections.Generic;
using SharedKernel;

namespace Modules.Stock.Domain.ValueObjects;

public sealed class Address : ValueObject
{
    public string Street { get; private set; }
    public string City { get; private set; }
    public string Wilaya { get; private set; }
    public string PostalCode { get; private set; }

    private Address() { } // EF Core

    private Address(string street, string city, string wilaya, string postalCode)
    {
        Street = street;
        City = city;
        Wilaya = wilaya;
        PostalCode = postalCode;
    }

    public static Address Create(string street, string city, string wilaya, string postalCode)
    {
        return new Address(street, city, wilaya, postalCode);
    }

    protected override IEnumerable<object> GetAtomicValues()
    {
        yield return Street;
        yield return City;
        yield return Wilaya;
        yield return PostalCode;
    }
}
