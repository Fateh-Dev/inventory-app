using System;
using System.Threading;
using System.Threading.Tasks;
using Modules.Stock.Domain.Enums;

namespace Modules.Stock.Domain.Services;

public interface IMovementNumberGenerator
{
    Task<string> GenerateAsync(StockMovementType type, CancellationToken ct = default);
}
