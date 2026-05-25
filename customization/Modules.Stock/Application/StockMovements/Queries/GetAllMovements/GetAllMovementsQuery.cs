using System;
using System.Collections.Generic;
using MediatR;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Domain.Enums;
using SharedKernel;

namespace Modules.Stock.Application.StockMovements.Queries.GetAllMovements;

public record GetAllMovementsQuery(
    StockMovementType? Type = null,
    StockMovementStatus? Status = null,
    Guid? WarehouseId = null,
    Guid? SupplierId = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    bool IncludeLines = false,
    string? SearchTerm = null,
    int? PageNumber = null,
    int? PageSize = null
) : IRequest<Result<IEnumerable<StockMovementDto>>>;
