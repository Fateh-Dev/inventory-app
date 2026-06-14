using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using SharedKernel;

namespace Modules.Stock.Domain.ValueObjects;

public sealed class LotNumber : ValueObject
{
    public string Value { get; private set; }

    private LotNumber() { } // EF Core

    private LotNumber(string value)
    {
        Value = value;
    }

    public static LotNumber Create(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("LotNumber cannot be empty", nameof(value));

        if (value.Length > 50)
            throw new ArgumentException("LotNumber cannot exceed 50 characters", nameof(value));

        if (!Regex.IsMatch(value, @"^[a-zA-Z0-9\-]+$"))
            throw new ArgumentException("LotNumber must be alphanumeric + dash", nameof(value));

        return new LotNumber(value);
    }

    public static implicit operator string(LotNumber lotNumber) => lotNumber?.Value;

    protected override IEnumerable<object> GetAtomicValues()
    {
        yield return Value;
    }

    public override string ToString() => Value;
}
