using System;
using System.Collections.Generic;
using MediatR;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Domain.Enums;
using SharedKernel;

namespace Modules.Stock.Application.StockMovements.Commands.UpdateMovement;

public record UpdateMovementCommand(
    Guid MovementId,
    DateTime MovementDate,
    string? Reference,
    string? Notes,
    List<UpdateMovementLineRequest> Lines
) : IRequest<Result<StockMovementDto>>;

public record UpdateMovementLineRequest(
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
