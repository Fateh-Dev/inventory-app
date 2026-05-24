using System;
using System.Collections.Generic;
using MediatR;
using Modules.Stock.Application.DTOs;
using SharedKernel;

namespace Modules.Stock.Application.Warehouses.Queries.GetWarehouseStock;

public record GetWarehouseStockQuery(Guid WarehouseId) : IRequest<Result<IEnumerable<StockLotDto>>>;
