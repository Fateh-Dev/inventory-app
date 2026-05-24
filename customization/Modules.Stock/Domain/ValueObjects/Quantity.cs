using System;
using System.Collections.Generic;
using Modules.Stock.Domain.Enums;
using SharedKernel;

namespace Modules.Stock.Domain.ValueObjects;

public sealed class Quantity : ValueObject
{
    public decimal Value { get; private set; }
    public UnitOfMeasure Unit { get; private set; }

    private Quantity() { } // EF Core

    private Quantity(decimal value, UnitOfMeasure unit)
    {
        Value = value;
        Unit = unit;
    }

    public static Quantity Create(decimal value, UnitOfMeasure unit)
    {
        if (value < 0)
            throw new ArgumentException("Quantity cannot be negative", nameof(value));

        return new Quantity(value, unit);
    }

    public static Quantity operator +(Quantity a, Quantity b)
    {
        if (a.Unit != b.Unit)
            throw new InvalidOperationException("Cannot add quantities with different units");

        return Create(a.Value + b.Value, a.Unit);
    }

    public static Quantity operator -(Quantity a, Quantity b)
    {
        if (a.Unit != b.Unit)
            throw new InvalidOperationException("Cannot subtract quantities with different units");

        if (a.Value - b.Value < 0)
            throw new InvalidOperationException("Resulting quantity cannot be negative");

        return Create(a.Value - b.Value, a.Unit);
    }

    protected override IEnumerable<object> GetAtomicValues()
    {
        yield return Value;
        yield return Unit;
    }

    public override string ToString() => $"{Value} {Unit}";
}
