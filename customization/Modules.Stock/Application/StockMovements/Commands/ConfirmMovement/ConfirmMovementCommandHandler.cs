using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Domain.Entities;
using Modules.Stock.Domain.Enums;
using Modules.Stock.Domain.Services;
using Modules.Stock.Domain.ValueObjects;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.StockMovements.Commands.ConfirmMovement;

public class ConfirmMovementCommandHandler : IRequestHandler<ConfirmMovementCommand, Result<Unit>>
{
    private readonly StockDbContext _context;
    private readonly IStockAlertService _alertService;

    public ConfirmMovementCommandHandler(StockDbContext context, IStockAlertService alertService)
    {
        _context = context;
        _alertService = alertService;
    }

    public async Task<Result<Unit>> Handle(ConfirmMovementCommand request, CancellationToken cancellationToken)
    {
        var movement = await _context.StockMovements
            .Include(m => m.Lines)
            .FirstOrDefaultAsync(m => m.Id == request.MovementId, cancellationToken);

        if (movement == null)
            return Result<Unit>.Failure(Error.NotFound("Movement.NotFound", "Movement not found"));

        if (movement.Status != StockMovementStatus.Pending)
            return Result<Unit>.Failure(Error.Validation("Movement.NotPending", "Only pending movements can be confirmed"));

        var affectedItems = new HashSet<StockItem>();

        foreach (var line in movement.Lines)
        {
            var item = await _context.StockItems.Include(i => i.Lots).FirstOrDefaultAsync(i => i.Id == line.StockItemId, cancellationToken);
            if (item == null)
                return Result<Unit>.Failure(Error.NotFound("StockItem.NotFound", $"Item {line.StockItemId} not found"));
            
            affectedItems.Add(item);

            if (movement.Type == StockMovementType.Reception)
            {
                var lotNum = LotNumber.Create($"LOT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}");
                var newLot = StockLot.Create(item.Id, movement.DestinationWarehouseId!.Value, lotNum, line.Quantity, line.UnitCost, line.ExpiryDate, item.DefaultLowStockThreshold, line.SerialNumber);
                _context.StockLots.Add(newLot);
                
                line.SetStockLotId(newLot.Id);
            }
            else
            {
                if (line.StockLotId == null)
                    return Result<Unit>.Failure(Error.Validation("StockLot.Required", "StockLotId is required to confirm this movement type"));

                var lot = await _context.StockLots.FirstOrDefaultAsync(l => l.Id == line.StockLotId.Value, cancellationToken);
                if (lot == null)
                    return Result<Unit>.Failure(Error.NotFound("StockLot.NotFound", $"Lot {line.StockLotId} not found"));

                if (movement.Type == StockMovementType.Issue || movement.Type == StockMovementType.Transfer || movement.Type == StockMovementType.Disposal)
                {
                    lot.Consume(line.Quantity.Value);
                }
                else if (movement.Type == StockMovementType.Return)
                {
                    lot.Replenish(line.Quantity.Value);
                }
                else if (movement.Type == StockMovementType.Adjustment)
                {
                    lot.Adjust(line.Quantity.Value, movement.Notes ?? "Adjustment confirmed");
                }
            }
        }

        movement.Confirm();
        await _context.SaveChangesAsync(cancellationToken);

        foreach (var item in affectedItems)
        {
            await _alertService.CheckAndCreateAlertsAsync(item, cancellationToken);
        }

        return Result<Unit>.Success(Unit.Value);
    }
}
