using System;
using MediatR;
using SharedKernel;

namespace Modules.Stock.Application.Warehouses.Commands.DeactivateWarehouse;

public record DeactivateWarehouseCommand(Guid Id) : IRequest<Result>;
