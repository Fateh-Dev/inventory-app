using System;
using System.Collections.Generic;
using MediatR;
using Modules.Stock.Application.DTOs;
using SharedKernel;

namespace Modules.Stock.Application.StockItems.Queries.GetLotsByStockItem;

public record GetLotsByStockItemQuery(Guid StockItemId, bool? ExcludeExpired = null) : IRequest<Result<IEnumerable<StockLotDto>>>;
