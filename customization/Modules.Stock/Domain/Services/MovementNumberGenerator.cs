using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Domain.Enums;
using Modules.Stock.Infrastructure.Persistence;

namespace Modules.Stock.Domain.Services;

public class MovementNumberGenerator : IMovementNumberGenerator
{
    private readonly StockDbContext _context;

    public MovementNumberGenerator(StockDbContext context)
    {
        _context = context;
    }

    public async Task<string> GenerateAsync(StockMovementType type, CancellationToken ct = default)
    {
        string prefix = type switch
        {
            StockMovementType.Reception => "REC",
            StockMovementType.Issue => "ISS",
            StockMovementType.Transfer => "TRF",
            StockMovementType.Return => "RET",
            StockMovementType.Adjustment => "ADJ",
            StockMovementType.Disposal => "DSP",
            _ => "MOV"
        };

        var datePart = DateTime.UtcNow.ToString("yyyyMMdd");
        var baseString = $"{prefix}-{datePart}-";

        var todaysMovementsCount = await _context.StockMovements
            .CountAsync(m => m.MovementNumber.StartsWith(baseString), ct);

        int nextSequence = todaysMovementsCount + 1;
        
        return $"{baseString}{nextSequence:D4}";
    }
}
