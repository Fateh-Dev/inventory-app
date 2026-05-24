using System;
using MediatR;
using SharedKernel;

namespace Modules.Stock.Application.StockItems.Commands.DeactivateStockItem;

public record DeactivateStockItemCommand(Guid Id) : IRequest<Result>;
