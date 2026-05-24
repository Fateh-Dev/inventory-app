using System;
using MediatR;
using SharedKernel;

namespace Modules.Stock.Application.StockMovements.Commands.CancelMovement;

public record CancelMovementCommand(Guid Id, string Reason) : IRequest<Result>;
