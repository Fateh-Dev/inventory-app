using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Domain.Entities;
using Modules.Stock.Domain.Enums;
using Modules.Stock.Domain.ValueObjects;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.StockMovements.Commands.UpdateMovement;

public class UpdateMovementCommandHandler : IRequestHandler<UpdateMovementCommand, Result<StockMovementDto>>
{
    private readonly StockDbContext _context;

    public UpdateMovementCommandHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<StockMovementDto>> Handle(UpdateMovementCommand request, CancellationToken cancellationToken)
    {
        var movement = await _context.StockMovements
            .Include(m => m.Lines)
            .FirstOrDefaultAsync(m => m.Id == request.MovementId, cancellationToken);

        if (movement == null)
            return Result<StockMovementDto>.Failure(Error.NotFound("Movement.NotFound", "Movement not found"));

        if (movement.Status != StockMovementStatus.Pending)
            return Result<StockMovementDto>.Failure(Error.Validation("Movement.NotPending", "Only pending movements can be updated"));

        if (request.Lines == null || !request.Lines.Any())
            return Result<StockMovementDto>.Failure(Error.Validation("Movement.EmptyLines", "A movement must contain at least one line."));

        movement.UpdateProperties(request.MovementDate, request.Reference, request.Notes);

        var newLines = new List<StockMovementLine>();
        foreach (var lineReq in request.Lines)
        {
            var item = await _context.StockItems.FirstOrDefaultAsync(i => i.Id == lineReq.StockItemId, cancellationToken);
            if (item == null)
                return Result<StockMovementDto>.Failure(Error.NotFound("StockItem.NotFound", $"Item {lineReq.StockItemId} not found"));

            if (movement.Type == StockMovementType.Reception)
            {
                if (item.RequiresSerialNumber && string.IsNullOrWhiteSpace(lineReq.SerialNumber))
                    return Result<StockMovementDto>.Failure(Error.Validation("StockLot.SerialNumberRequired", $"Item {item.Reference} requires a serial number"));
                if (item.HasExpiryDate && !lineReq.ExpiryDate.HasValue)
                    return Result<StockMovementDto>.Failure(Error.Validation("StockLot.ExpiryDateRequired", $"Item {item.Reference} requires an expiry date"));
            }
            else
            {
                if (lineReq.StockLotId == null)
                    return Result<StockMovementDto>.Failure(Error.Validation("StockLot.Required", "StockLotId is required for this movement type"));
            }

            var qty = Quantity.Create(lineReq.Quantity, lineReq.Unit);
            var cost = MoneyAmount.Create(lineReq.UnitCost, lineReq.Currency);

            var lineObj = new StockMovementLine(movement.Id, item.Id, movement.Type == StockMovementType.Reception ? null : lineReq.StockLotId, qty, cost, lineReq.ExpiryDate, lineReq.SerialNumber, lineReq.Notes);

            newLines.Add(lineObj);
        }

        movement.UpdateLines(newLines);

        await _context.SaveChangesAsync(cancellationToken);

        // Fetch names for DTO
        var sourceWh = movement.SourceWarehouseId.HasValue ? await _context.Warehouses.FindAsync(movement.SourceWarehouseId.Value) : null;
        var destWh = movement.DestinationWarehouseId.HasValue ? await _context.Warehouses.FindAsync(movement.DestinationWarehouseId.Value) : null;
        var supplier = movement.SupplierId.HasValue ? await _context.Suppliers.FindAsync(movement.SupplierId.Value) : null;
        var department = movement.DepartmentId.HasValue ? await _context.Departments.FindAsync(movement.DepartmentId.Value) : null;

        var dto = new StockMovementDto
        {
            Id = movement.Id,
            MovementNumber = movement.MovementNumber,
            Type = movement.Type.ToString(),
            TypeId = (int)movement.Type,
            Status = movement.Status.ToString(),
            StatusId = (int)movement.Status,
            SourceWarehouseId = movement.SourceWarehouseId,
            SourceWarehouseName = sourceWh?.Name,
            DestinationWarehouseId = movement.DestinationWarehouseId,
            DestinationWarehouseName = destWh?.Name,
            SupplierId = movement.SupplierId,
            SupplierName = supplier?.Name,
            DepartmentId = movement.DepartmentId,
            DepartmentName = department?.Name,
            Reference = movement.Reference,
            MovementDate = movement.MovementDate,
            Notes = movement.Notes,
            CreatedByUser = movement.CreatedByUser,
            CreatedAt = DateTime.UtcNow,
            Lines = movement.Lines.Select(l => new StockMovementLineDto
            {
                Id = l.Id,
                StockItemId = l.StockItemId,
                StockLotId = l.StockLotId,
                Quantity = l.Quantity.Value,
                Unit = l.Quantity.Unit.ToString(),
                UnitCost = l.UnitCost.Amount,
                Currency = l.UnitCost.Currency,
                LineTotal = l.Quantity.Value * l.UnitCost.Amount,
                Notes = l.Notes ?? string.Empty,
                ExpiryDate = l.ExpiryDate,
                SerialNumber = l.SerialNumber
            }).ToList(),
            TotalValue = movement.Lines.Sum(l => l.Quantity.Value * l.UnitCost.Amount)
        };

        return Result<StockMovementDto>.Success(dto);
    }
}
