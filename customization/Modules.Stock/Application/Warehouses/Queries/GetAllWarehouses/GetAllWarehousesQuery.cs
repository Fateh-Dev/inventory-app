using System.Collections.Generic;
using MediatR;
using Modules.Stock.Application.DTOs;
using SharedKernel;

namespace Modules.Stock.Application.Warehouses.Queries.GetAllWarehouses;

public record GetAllWarehousesQuery(bool? ActiveOnly = null) : IRequest<Result<IEnumerable<WarehouseDto>>>;
