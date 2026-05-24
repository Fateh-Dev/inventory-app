using System;
using MediatR;
using Modules.Stock.Application.DTOs;
using SharedKernel;

namespace Modules.Stock.Application.StockMovements.Queries.GetMovementById;

public record GetMovementByIdQuery(Guid Id) : IRequest<Result<StockMovementDto>>;
