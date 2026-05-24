using System;
using System.Collections.Generic;
using SharedKernel;

namespace Modules.Stock.Domain.ValueObjects;

public sealed class MoneyAmount : ValueObject
{
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = "DZD";

    private MoneyAmount() { } // EF Core

    private MoneyAmount(decimal amount, string currency)
    {
        Amount = amount;
        Currency = currency;
    }

    public static MoneyAmount Create(decimal amount, string currency = "DZD")
    {
        if (amount < 0)
            throw new ArgumentException("Amount cannot be negative", nameof(amount));

        if (string.IsNullOrWhiteSpace(currency) || currency.Length > 3)
            throw new ArgumentException("Currency must be max 3 characters", nameof(currency));

        return new MoneyAmount(amount, currency.ToUpperInvariant());
    }

    protected override IEnumerable<object> GetAtomicValues()
    {
        yield return Amount;
        yield return Currency;
    }

    public override string ToString() => $"{Amount} {Currency}";
}
