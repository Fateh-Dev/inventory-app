using System;
using System.Collections.Generic;
using MediatR;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Domain.Enums;
using SharedKernel;

namespace Modules.Stock.Application.StockMovements.Commands.CreateMovement;

public record CreateMovementCommand(
    StockMovementType Type,
    Guid? SourceWarehouseId,
    Guid? DestinationWarehouseId,
    Guid? SupplierId,
    Guid? DepartmentId,
    string? Reference,
    DateTime MovementDate,
    string? Notes,
    string CreatedByUser,
    List<CreateMovementLineRequest> Lines
) : IRequest<Result<StockMovementDto>>;

public record CreateMovementLineRequest(
    Guid StockItemId,
    Guid? StockLotId,
    decimal Quantity,
    UnitOfMeasure Unit,
    decimal UnitCost,
    string Currency,
    string? Notes,
    DateTime? ExpiryDate,
    string? SerialNumber
);
