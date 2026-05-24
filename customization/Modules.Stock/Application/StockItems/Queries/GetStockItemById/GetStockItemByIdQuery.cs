using System;
using MediatR;
using Modules.Stock.Application.DTOs;
using SharedKernel;

namespace Modules.Stock.Application.StockItems.Queries.GetStockItemById;

public record GetStockItemByIdQuery(Guid Id) : IRequest<Result<StockItemDto>>;
