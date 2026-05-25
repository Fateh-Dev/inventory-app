using System.Collections.Generic;
using MediatR;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Domain.Enums;
using SharedKernel;

namespace Modules.Stock.Application.StockItems.Queries.GetAllStockItems;

public record GetAllStockItemsQuery(
    Guid? CategoryId = null,
    bool? ActiveOnly = null,
    bool? LowStockOnly = null,
    bool? HasExpiryOnly = null,
    string? SearchTerm = null,
    int? PageNumber = null,
    int? PageSize = null
) : IRequest<Result<IEnumerable<StockItemDto>>>;
