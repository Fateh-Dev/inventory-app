using System;
using MediatR;
using SharedKernel;

namespace Modules.Stock.Application.Warehouses.Commands.ActivateWarehouse;

public record ActivateWarehouseCommand(Guid Id) : IRequest<Result>;
