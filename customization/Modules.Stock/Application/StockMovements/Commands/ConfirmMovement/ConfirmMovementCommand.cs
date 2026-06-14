using System;
using MediatR;
using SharedKernel;

namespace Modules.Stock.Application.StockMovements.Commands.ConfirmMovement;

public record ConfirmMovementCommand(Guid MovementId) : IRequest<Result<Unit>>;
